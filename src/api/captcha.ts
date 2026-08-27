


export type CaptchaMode = 'none' | 'turnstile' | 'math' | 'geetest';

export interface CaptchaConfig {
  mode: CaptchaMode;
  loginRequired: boolean;
  registerRequired: boolean;
  forgotRequired: boolean;
  turnstileSiteKey: string;
  geetestCaptchaId: string;
}

export interface MathCaptcha {
  question: string;
  token: string;
}


export interface CaptchaPayload {
  mode: CaptchaMode;
  turnstileToken?: string;
  mathToken?: string;
  mathAnswer?: number;
  lotNumber?: string;
  captchaOutput?: string;
  passToken?: string;
  genTime?: string;
}

export async function fetchCaptchaConfig(): Promise<CaptchaConfig | null> {
  try {
    const res = await fetch('/api/v1/auth/captcha/config', {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 0 || !data.data) return null;
    return data.data as CaptchaConfig;
  } catch {
    return null;
  }
}

export async function fetchMathCaptcha(): Promise<MathCaptcha | null> {
  try {
    const res = await fetch('/api/v1/auth/captcha/math', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 0 || !data.data) return null;
    return data.data as MathCaptcha;
  } catch {
    return null;
  }
}
