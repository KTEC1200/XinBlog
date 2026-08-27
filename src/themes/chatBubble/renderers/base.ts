import type { SxProps, Theme } from '@mui/material/styles';
import type { ThemeParamSchema } from '@/types';


export interface ChatBubbleRenderContext {
  themeColor?: string;
  borderRadius?: number;
}


export interface ChatBubbleRenderOutput {
  mine?: SxProps<Theme>;
  other?: SxProps<Theme>;
  mineImage?: SxProps<Theme>;
  otherImage?: SxProps<Theme>;
}

export interface ChatBubbleRenderer<P extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  name: string;
  description?: string;
  aliases?: string[];
  defaultParams: P;
  schema: ThemeParamSchema[];
  render: (params: P, context: ChatBubbleRenderContext) => ChatBubbleRenderOutput;
}


export function resolveThemeColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const s = value.trim().toLowerCase();
  const empty = ['#000', '#000000', '000000', '000', 'rgb(0,0,0)', 'rgba(0,0,0,0)', 'transparent'];
  if (empty.includes(s)) return fallback;
  return value;
}

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type BubbleCorners = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';


export function resolveImageRadius(imageRadius: number | undefined, radius: number, cap = 28): number {
  return Math.min(cap, imageRadius || Math.max(4, radius - 2));
}


export function bubbleRadius(
  corner: Corner,
  radius: number
): Record<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', number> {
  return {
    'top-left': radius,
    'top-right': radius,
    'bottom-left': radius,
    'bottom-right': radius,
    [corner]: Math.max(2, Math.min(4, Math.floor(radius * 0.2))),
  } as Record<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', number>;
}