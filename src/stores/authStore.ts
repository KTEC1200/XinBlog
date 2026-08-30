import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiPost } from '@/api/client';
import type { CaptchaPayload } from '@/api/captcha';

export type UserRole = 'guest' | 'admin' | 'super_admin';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface AuthResult {
  ok: boolean;
  msg?: string;
  needCode?: boolean;
  debug?: Record<string, unknown>;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  login: (username: string, password: string, code?: string, captcha?: CaptchaPayload) => Promise<AuthResult>;
  register: (username: string, password: string, email: string, code?: string, captcha?: CaptchaPayload) => Promise<AuthResult>;
  sendForgotCode: (username: string, email: string, captcha?: CaptchaPayload) => Promise<AuthResult>;
  resetPassword: (username: string, email: string, code: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  checkAuth: () => boolean;
  refresh: () => Promise<boolean>;
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

// 全局登录状态同步的 storage key
const AUTH_SYNC_KEY = 'auth-state-sync';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,

      login: async (username: string, password: string, code?: string, captcha?: CaptchaPayload) => {
        const res = await apiPost<LoginResult>('/api/v1/auth/login', { username, password, code, ...(captcha || {}) });
        if (res.code !== 0 || !res.data) {
          return { ok: false, msg: res.msg || (res.code >= 500 ? '服务器内部错误' : '登录失败'), needCode: res.code === 403 && (res.data as { needCode?: boolean })?.needCode };
        }

        const { accessToken, refreshToken, user } = res.data;
        set({
          isAuthenticated: true,
          user,
          token: accessToken,
          refreshToken,
        });
        localStorage.setItem(
          AUTH_SYNC_KEY,
          JSON.stringify({ isAuthenticated: true, user, token: accessToken, refreshToken })
        );
        return { ok: true };
      },

      register: async (username: string, password: string, email: string, code?: string, captcha?: CaptchaPayload) => {
        const res = await apiPost<{ id: number; username: string; role: UserRole }>('/api/v1/auth/register', {
          username,
          password,
          email,
          code,
          ...(captcha || {}),
        });
        if (res.code !== 0) {
          return { ok: false, msg: res.msg || (res.code >= 500 ? '服务器内部错误' : '注册失败') };
        }
        return { ok: true };
      },

      sendForgotCode: async (username: string, email: string, captcha?: CaptchaPayload) => {
        const res = await apiPost<{ sent?: boolean }>('/api/v1/auth/forgot-code', {
          username,
          email,
          ...(captcha || {}),
        });
        const debug = (res as { data?: { _debug?: Record<string, unknown> } }).data?._debug;
        // 统一反馈，不区分邮箱是否已注册，防止账号枚举
        if (res.code !== 0) {
          return { ok: false, msg: res.msg || (res.code >= 500 ? '服务器内部错误' : '发送失败'), debug };
        }
        return { ok: true, msg: res.msg || '验证码已发送', debug };
      },

      resetPassword: async (username: string, email: string, code: string, password: string) => {
        const res = await apiPost('/api/v1/auth/reset-password', { username, email, code, password });
        if (res.code !== 0) {
          return { ok: false, msg: res.msg || (res.code >= 500 ? '服务器内部错误' : '重置失败') };
        }
        return { ok: true, msg: res.msg || '密码已重置，请使用新密码登录' };
      },

      logout: () => {
        // 通知后端撤销 refresh token（可选，失败不影响本地登出）
        const token = get().refreshToken;
        if (token) {
          apiPost('/api/v1/auth/logout', { refreshToken: token }).catch(() => {});
        }
        set({ isAuthenticated: false, user: null, token: null, refreshToken: null });
        localStorage.removeItem(AUTH_SYNC_KEY);
        // 登出时清除本地主题/UI缓存，避免下一个未登录用户看到上一个用户的设置
        localStorage.removeItem('theme-config');
        localStorage.removeItem('ui-preferences');
      },

      checkAuth: () => {
        const { isAuthenticated, token } = get();
        if (!isAuthenticated || !token) return false;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            // token 过期但刷新逻辑交给 refresh；先不登出，避免页面抖动
            return false;
          }
          return true;
        } catch {
          get().logout();
          return false;
        }
      },

      refresh: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return false;
        }
        const res = await apiPost<LoginResult>('/api/v1/auth/refresh', { refreshToken });
        if (res.code !== 0 || !res.data) {
          get().logout();
          return false;
        }
        const { accessToken, refreshToken: newRefreshToken, user } = res.data;
        set({ isAuthenticated: true, user, token: accessToken, refreshToken: newRefreshToken });
        localStorage.setItem(
          AUTH_SYNC_KEY,
          JSON.stringify({ isAuthenticated: true, user, token: accessToken, refreshToken: newRefreshToken })
        );
        return true;
      },

      setAuth: (token, refreshToken, user) => {
        set({ isAuthenticated: true, user, token, refreshToken });
        localStorage.setItem(
          AUTH_SYNC_KEY,
          JSON.stringify({ isAuthenticated: true, user, token, refreshToken })
        );
      },

      updateUser: (patch) => {
        const current = get().user;
        if (!current) return;
        const next = { ...current, ...patch };
        set({ user: next });
        localStorage.setItem(
          AUTH_SYNC_KEY,
          JSON.stringify({ isAuthenticated: true, user: next, token: get().token, refreshToken: get().refreshToken })
        );
      },
    }),
    {
      name: 'auth-state',
    }
  )
);

// 监听其他标签页的登录/登出，保持全局状态同步
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== AUTH_SYNC_KEY) return;

    const newValue = event.newValue;
    if (!newValue) {
      useAuthStore.setState({ isAuthenticated: false, user: null, token: null, refreshToken: null });
      return;
    }

    try {
      const state = JSON.parse(newValue);
      useAuthStore.setState({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      });
    } catch {
      // 忽略异常数据
    }
  });
}
