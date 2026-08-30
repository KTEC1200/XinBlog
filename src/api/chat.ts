import { apiGet, apiPatch, apiPost, apiDelete } from './client';
import { getToken } from '../utils/token';
import type { ApiResult, ChatSettings, CustomChatRoom, RoomUserOption } from '../types/interaction';

const CHAT_CACHE_KEY = 'chat-settings-cache';
const CACHE_TTL = 5 * 60 * 1000;


export const PUBLIC_CHAT_ROOM_KEY = 'public';
export const PUBLIC_CHAT_ROOM_NAME = '公共聊天房';


export const ALL_USERS_CHAT_ROOM_KEY = 'members';
export const ALL_USERS_CHAT_ROOM_NAME = '全体聊天房';

interface CachedSettings {
  data: ChatSettings;
  ts: number;
}

function readLocalCache(): ChatSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CHAT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSettings;
    if (!parsed.data || Date.now() - parsed.ts > CACHE_TTL) {
      localStorage.removeItem(CHAT_CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeLocalCache(data: ChatSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    
  }
}

function clearLocalCache() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CHAT_CACHE_KEY);
  } catch {
    
  }
}

const defaultChatSettings: ChatSettings = {
  enabled: false,
  publicRoomEnabled: true,
  allUsersRoomEnabled: true,
};

export async function getChatSettings() {
  const cached = readLocalCache();
  if (cached) {
    const merged = { ...defaultChatSettings, ...cached };
    writeLocalCache(merged);
    return { code: 0, data: merged, msg: 'ok' } as ApiResult<ChatSettings>;
  }

  const res = await apiGet<ChatSettings>('/api/v1/settings/chat');
  if (res.code === 0 && res.data) {
    const merged = { ...defaultChatSettings, ...res.data };
    writeLocalCache(merged);
    return { ...res, data: merged };
  }
  return res;
}


export async function getAdminChatSettings() {
  const res = await apiGet<ChatSettings>('/api/v1/admin/settings/chat');
  if (res.code === 0 && res.data) {
    const merged = { ...defaultChatSettings, ...res.data };
    return { ...res, data: merged };
  }
  return res;
}

export async function updateChatSettings(data: ChatSettings) {
  const normalized = {
    enabled: data.enabled === true,
    publicRoomEnabled: data.publicRoomEnabled !== false,
    allUsersRoomEnabled: data.allUsersRoomEnabled !== false,
  };
  const res = await apiPatch<ChatSettings>('/api/v1/admin/settings/chat', normalized);
  if (res.code === 0) {
    const merged = { ...defaultChatSettings, ...normalized, ...(res.data || {}) };
    writeLocalCache(merged);
    return { ...res, data: merged };
  } else {
    clearLocalCache();
  }
  return res;
}





export function buildChatWebSocketUrl(roomKey: string, token?: string, nickname?: string): string {
  const base = window.location;
  const protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  const params = new URLSearchParams();
  if (token) params.set('token', token);
  if (nickname) params.set('nickname', nickname);
  const qs = params.toString();
  return `${protocol}//${base.host}/api/chat/room/${encodeURIComponent(roomKey)}/websocket${qs ? `?${qs}` : ''}`;
}



export async function checkGuestNickname(name: string): Promise<{ ok: boolean; message?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: '昵称不能为空' };
  try {
    const res = await apiGet<{ ok: boolean }>(
      `/api/chat/check-nickname?name=${encodeURIComponent(trimmed)}`
    );
    if (res.code === 0) return { ok: true };
    return { ok: false, message: res.msg || '该昵称已被注册用户占用，请换一个' };
  } catch {
    return { ok: false, message: '校验昵称失败，请稍后重试' };
  }
}



export interface CustomRoomListResult {
  list: CustomChatRoom[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminRoomInput {
  name: string;
  description?: string;
  cover?: string;
  max_users?: number;
  members?: number[];
  enabled?: boolean;
}


export async function getMyChatRooms() {
  const res = await apiGet<{ list: CustomChatRoom[] }>('/api/v1/chat/my-rooms');
  return res;
}


export async function getAdminChatRooms(page = 1, limit = 20) {
  const res = await apiGet<CustomRoomListResult>(`/api/v1/admin/chat/rooms?page=${page}&limit=${limit}`);
  return res;
}


export async function searchRoomUsers(keyword = '', page = 1, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (keyword) params.set('keyword', keyword);
  const res = await apiGet<{ list: RoomUserOption[]; total: number; page: number; limit: number }>(
    `/api/v1/admin/chat/rooms/search-users?${params.toString()}`
  );
  return res;
}


export async function getAdminChatRoomMembers(roomKey: string) {
  const res = await apiGet<{ list: RoomUserOption[] }>(`/api/v1/admin/chat/rooms/${roomKey}/members`);
  return res;
}


export async function createChatRoom(data: AdminRoomInput) {
  const res = await apiPost<{ room_key: string }>('/api/v1/admin/chat/rooms', data);
  return res;
}


export async function updateChatRoom(roomKey: string, data: Omit<AdminRoomInput, 'members' | 'enabled'> & { members?: number[]; enabled?: boolean }) {
  const res = await apiPatch<unknown>(`/api/v1/admin/chat/rooms/${roomKey}`, data);
  return res;
}


export async function deleteChatRoom(roomKey: string) {
  const res = await apiDelete<unknown>(`/api/v1/admin/chat/rooms/${roomKey}`);
  return res;
}





export function buildChatMediaUrl(roomKey: string, id: string): string {
  const token = getToken();
  const base = `/api/v1/chat/media/${encodeURIComponent(roomKey)}/${encodeURIComponent(id)}`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}


export async function uploadChatImage(roomKey: string, mime: string, base64: string): Promise<string> {
  const token = getToken();
  const res = await fetch(
    `/api/v1/chat/media/upload?room=${encodeURIComponent(roomKey)}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ mime, base64 }),
    }
  );
  let data: { id?: string; error?: string; code?: string } = {};
  try {
    data = (await res.json()) as typeof data;
  } catch {
    
  }
  if (!res.ok || !data.id) {
    throw new Error(data.error || '图片上传失败');
  }
  return data.id;
}



export interface AdminChatDoRoom {
  roomKey: string;
  
  name?: string;
  messageCount?: number;
  mediaCount?: number;
  mediaBytes?: number;
  error?: boolean;
}

export interface AdminChatDoItem {
  id: string;
  mime: string;
  bytes: number;
}


export async function fetchAdminChatDoOverview(): Promise<AdminChatDoRoom[] | null> {
  const res = await apiGet<{ rooms: AdminChatDoRoom[] }>('/api/v1/admin/chat/do/overview');
  if (res.code !== 0 || !res.data) return null;
  return res.data.rooms || [];
}


export async function fetchAdminChatMedia(roomKey: string): Promise<AdminChatDoItem[] | null> {
  const res = await apiGet<{ items: AdminChatDoItem[] }>(`/api/v1/admin/chat/do/media/${encodeURIComponent(roomKey)}`);
  if (res.code !== 0 || !res.data) return null;
  return res.data.items || [];
}


export async function deleteAdminChatMedia(roomKey: string, id: string): Promise<boolean> {
  const res = await apiDelete<unknown>(`/api/v1/admin/chat/do/media/${encodeURIComponent(roomKey)}/${encodeURIComponent(id)}`);
  return res.code === 0;
}