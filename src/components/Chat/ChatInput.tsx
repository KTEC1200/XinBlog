import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box, IconButton, InputBase, Typography, CircularProgress, alpha } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import ImageIcon from '@mui/icons-material/Image';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import VideocamIcon from '@mui/icons-material/Videocam';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { uploadChatImage } from '@/api/chat';


const EmojiPicker = lazy(() => import('./EmojiPicker'));

export interface ChatQuote {
  name: string;
  content: string;
  
  timestamp?: number;
}

interface ChatInputProps {
  disabled?: boolean;
  quote?: ChatQuote | null;
  onClearQuote?: () => void;
  onSend: (text: string) => boolean;
  
  focusSignal?: number;
  
  roomKey: string;
  
  onTyping?: () => void;
  
  onVoiceCall?: () => void;
  
  onVideoCall?: () => void;
}

function truncate(text: string, max: number): string {
  const s = text.replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max) + '…' : s;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}



const MAX_UPLOAD_BASE64 = 105_000; 


async function compressToUploadable(file: File): Promise<{ mime: string; base64: string }> {
  const rawDataUrl = await fileToBase64(file);
  const rawBase64 = rawDataUrl.slice(rawDataUrl.indexOf(',') + 1);
  
  if (rawBase64.length <= MAX_UPLOAD_BASE64) {
    return { mime: file.type, base64: rawBase64 };
  }
  
  if (typeof createImageBitmap !== 'function') {
    return file.type.startsWith('image/') ? { mime: file.type, base64: rawBase64 } : { mime: 'image/jpeg', base64: rawBase64 };
  }
  const source = await createImageBitmap(file);
  const MAX_DIM = 1400;
  let width = source.width;
  let height = source.height;
  if (Math.max(width, height) > MAX_DIM) {
    const ratio = MAX_DIM / Math.max(width, height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  let scale = 1;
  let quality = 0.85;
  let base64 = '';
  for (let i = 0; i < 14; i++) {
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    base64 = canvas.toDataURL('image/jpeg', quality).slice('data:image/jpeg;base64,'.length);
    if (base64.length <= MAX_UPLOAD_BASE64) break;
    if (quality > 0.4) {
      quality -= 0.12; 
    } else {
      scale *= 0.72; 
      quality = 0.85;
    }
  }
  source.close?.();
  return { mime: 'image/jpeg', base64 };
}

export default function ChatInput({ disabled, quote, onClearQuote, onSend, focusSignal, roomKey, onTyping, onVoiceCall, onVideoCall }: ChatInputProps) {
  const [value, setValue] = useState('');
  
  const [inputFocused, setInputFocused] = useState(false);
  
  const [open, setOpen] = useState(false);
  
  const [activeView, setActiveView] = useState<'menu' | 'emoji'>('menu');
  
  const [panelHeight, setPanelHeight] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  const [postError, setPostError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  
  
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!open) {
      setPanelHeight(0);
      return;
    }
    if (!el) return;
    const update = () => setPanelHeight(el.scrollHeight);
    update();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    return undefined;
  }, [open]);

  
  const close = () => setOpen(false);

  
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
    
  }, [open]);

  
  useEffect(() => {
    if (focusSignal && focusSignal > 0) inputRef.current?.focus();
  }, [focusSignal]);

  const doSend = () => {
    
    
    const quoted = quote
      ? quote.timestamp
        ? `> [@${quote.name}：${truncate(quote.content, 100)}](cite:${quote.timestamp})\n\n`
        : `> @${quote.name}：${truncate(quote.content, 100)}\n\n`
      : '';
    const ok = onSend(quoted + value);
    if (ok) {
      setValue('');
      onClearQuote?.();
    }
  };

  const insertEmoji = (emoji: string) => {
    setValue((v) => v + emoji);
    inputRef.current?.focus();
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || uploading) return;
    if (!file.type.startsWith('image/')) {
      showPostError('仅支持图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showPostError('图片不能超过 5MB');
      return;
    }
    setUploading(true);
    try {
      const { mime, base64 } = await compressToUploadable(file);
      if (base64.length > MAX_UPLOAD_BASE64) {
        showPostError('图片过大，压缩后仍超出限制');
        return;
      }
      const id = await uploadChatImage(roomKey, mime, base64);
      const ok = onSend(`![图片](chat-media://${id})\n`);
      if (ok) close();
    } catch {
      showPostError('发送失败，请稍后重试');
    } finally {
      setUploading(false);
    }
  };

  const showPostError = (msg: string) => {
    setPostError(msg);
    window.setTimeout(() => setPostError((cur) => (cur === msg ? '' : cur)), 3000);
  };

  return (
    <Box
      ref={rootRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        px: 1.5,
        py: 1,
        borderTop: '1px solid',
        borderColor: (t) => alpha(t.palette.divider, 0.8),
      }}
    >
      {quote && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0.75,
            px: 1.25,
            py: 0.75,
            borderRadius: (t) => `${Math.max(4, t.shape.borderRadius - 4)}px`,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
            borderLeft: (t) => `3px solid ${alpha(t.palette.primary.main, 0.5)}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.secondary' }}
          >
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
              引用
            </Box>

            {' '}@{quote.name}：{quote.content}
          </Typography>

          <IconButton size="small" onClick={() => onClearQuote?.()} aria-label="取消引用" sx={{ flexShrink: 0 }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>

        </Box>

      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <InputBase
          inputRef={inputRef}
          value={value}
          disabled={disabled}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            
            if (inputFocused && next.trim()) onTyping?.();
          }}
          placeholder={disabled ? '正在连接聊天室…' : '说点什么…'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              doSend();
            }
          }}
          multiline
          maxRows={3}
          sx={{
            flex: 1,
            px: 1.5,
            py: 1,
            borderRadius: (t) => `${t.shape.borderRadius}px`,
            bgcolor: (t) => alpha(t.palette.text.primary, 0.02),
            border: '1px solid',
            borderColor: (t) => alpha(t.palette.divider, 0.7),
            transition: 'border-color .2s ease, box-shadow .2s ease, background-color .2s ease',
            fontSize: '0.95rem',
            
            '&.Mui-focused': {
              borderColor: (t) => t.palette.primary.main,
              boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.14)}`,
            },
            '& .MuiInputBase-input': { py: 0 },
          }}
        />
        <IconButton
          color="primary"
          disabled={disabled || !value.trim()}
          onClick={doSend}
          sx={{
            flexShrink: 0,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.2) },
          }}
        >
          <SendIcon sx={{ fontSize: 22 }} />
        </IconButton>

        {}
        <IconButton
          color={open ? 'primary' : 'default'}
          disabled={disabled}
          onClick={() => {
            if (open) close();
            else {
              setActiveView('menu');
              setOpen(true);
            }
          }}
          sx={{
            flexShrink: 0,
            transition: 'transform .2s ease',
            transform: open ? 'rotate(45deg)' : 'none',
          }}
        >
          <AddCircleOutlineIcon sx={{ fontSize: 26 }} />
        </IconButton>

      </Box>


      {}
      <Box
        sx={{
          mt: 0.5,
          height: panelHeight,
          overflow: 'hidden',
          transition: 'height 300ms cubic-bezier(.4,0,.2,1)',
        }}
      >
        <Box
          ref={innerRef}
          sx={{
            borderRadius: (t) => `${t.shape.borderRadius}px`,
            bgcolor: (t) => alpha(t.palette.text.primary, 0.03),
            border: '1px solid',
            borderColor: (t) => alpha(t.palette.divider, 0.6),
            overflow: 'hidden',
          }}
        >
        {}
        {postError && (
          <Typography
            variant="caption"
            sx={{ display: 'block', px: 1.5, pt: 1, color: 'warning.main' }}
          >
            {postError}
          </Typography>

        )}

        {}
        {(open || panelHeight > 0) && activeView === 'menu' && (
          <Box sx={{ display: 'flex', gap: 1.5, p: 1.5 }}>
            <Box
              component="button"
              type="button"
              onClick={() => setActiveView('emoji')}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                width: 64,
                py: 1,
                border: 'none',
                borderRadius: 2,
                bgcolor: 'transparent',
                cursor: 'pointer',
                '&:hover': (t) => ({ bgcolor: alpha(t.palette.text.primary, 0.06) }),
              }}
            >
              <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                    color: 'primary.main',
                  }}
                >
                  <SentimentSatisfiedAltIcon sx={{ fontSize: 28 }} />
                </Box>

                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  表情
                </Typography>

              </Box>

              {}
              <Box
                component="label"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  width: 64,
                  py: 1,
                  borderRadius: 2,
                  cursor: uploading ? 'wait' : 'pointer',
                  pointerEvents: uploading ? 'none' : 'auto',
                  opacity: uploading ? 0.6 : 1,
                  '&:hover': (t) => ({ bgcolor: alpha(t.palette.text.primary, 0.06) }),
                }}
              >
                <input type="file" accept="image/*" onChange={handleImageFile} tabIndex={-1} style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }} />
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                    color: 'primary.main',
                  }}
                >
                  {uploading ? <CircularProgress size={22} /> : <ImageIcon sx={{ fontSize: 28 }} />}
                </Box>

                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  图片
                </Typography>

              </Box>

              {}
              <Box
                component="button"
                type="button"
                onClick={() => {
                  close();
                  onVoiceCall?.();
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  width: 64,
                  py: 1,
                  border: 'none',
                  borderRadius: 2,
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  '&:hover': (t) => ({ bgcolor: alpha(t.palette.text.primary, 0.06) }),
                }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: (t) => alpha(t.palette.secondary.main, 0.14),
                    color: 'secondary.main',
                  }}
                >
                  <PhoneInTalkIcon sx={{ fontSize: 28 }} />
                </Box>

                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  语音通话
                </Typography>

              </Box>

              {}
              <Box
                component="button"
                type="button"
                onClick={() => {
                  close();
                  onVideoCall?.();
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  width: 64,
                  py: 1,
                  border: 'none',
                  borderRadius: 2,
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  '&:hover': (t) => ({ bgcolor: alpha(t.palette.text.primary, 0.06) }),
                }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: (t) => alpha(t.palette.success.main, 0.14),
                    color: 'success.main',
                  }}
                >
                  <VideocamIcon sx={{ fontSize: 28 }} />
                </Box>

                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  视频通话
                </Typography>

              </Box>

            </Box>

          )}

          {}
          {(open || panelHeight > 0) && activeView === 'emoji' && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 0.75, py: 0.5 }}>
                <IconButton size="small" onClick={() => setActiveView('menu')} aria-label="返回菜单">
                  <ArrowBackIcon sx={{ fontSize: 20 }} />
                </IconButton>

                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  表情
                </Typography>

              </Box>

              <Suspense fallback={<Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={28} /></Box>}>

                <Box sx={{ p: 0.5 }}>
                  <EmojiPicker onEmoji={insertEmoji} />
                </Box>

              </Suspense>

            </Box>

          )}
        </Box>

      </Box>

    </Box>

  );
}