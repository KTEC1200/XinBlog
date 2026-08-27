import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Grow,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  fetchCaptchaConfig,
  fetchMathCaptcha,
  type CaptchaConfig,
  type CaptchaPayload,
} from '@/api/captcha';


function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('加载验证 SDK 失败'));
    document.head.appendChild(s);
  });
}

interface HumanCaptchaProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (payload: CaptchaPayload) => void;
  
  inline?: boolean;
}

export interface HumanCaptchaHandle {
  
  trigger: () => void;
}




export const HumanCaptcha = forwardRef<HumanCaptchaHandle, HumanCaptchaProps>(
  function HumanCaptcha({ open, onClose, onSuccess, inline }, ref) {
    const theme = useTheme();
    const [config, setConfig] = useState<CaptchaConfig | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(false);

    
    const [math, setMath] = useState<{ question: string; token: string } | null>(null);
    const [mathAnswer, setMathAnswer] = useState('');
    const [mathLoading, setMathLoading] = useState(false);

    
    const turnstileRef = useRef<HTMLDivElement | null>(null);
    const [turnstileError, setTurnstileError] = useState(false);

    
    const geetestObjRef = useRef<{
      destroy?: () => void;
      showCaptcha?: () => void;
    } | null>(null);
    const [geetestError, setGeetestError] = useState(false);
    const [geetestReady, setGeetestReady] = useState(false);
    const [geetestLoading, setGeetestLoading] = useState(false);

    
    const trigger = useCallback(() => {
      if (geetestObjRef.current?.showCaptcha) {
        setGeetestLoading(true);
        geetestObjRef.current.showCaptcha();
      }
    }, []);

    useImperativeHandle(ref, () => ({ trigger }), [trigger]);

    
    const finish = (payload: CaptchaPayload) => {
      onSuccess(payload);
      if (!inline) onClose();
    };

  
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingConfig(true);
    setConfig(null);
    setMath(null);
    setMathAnswer('');
    setTurnstileError(false);
    setGeetestError(false);
    fetchCaptchaConfig().then((cfg) => {
      if (cancelled) return;
      setLoadingConfig(false);
      if (!cfg) {
        if (!inline) onClose();
        return;
      }
      setConfig(cfg);
      if (cfg.mode === 'none') {
        
        finish({ mode: 'none' });
      }
    });
    return () => {
      cancelled = true;
    };
    
  }, [open]);

  
  useEffect(() => {
    if (open) return;
    const w = window as unknown as Record<string, unknown>;
    if (turnstileRef.current && (w as { turnstile?: { remove?: (el: HTMLElement) => void } }).turnstile?.remove) {
      try {
        (w as { turnstile: { remove: (el: HTMLElement) => void } }).turnstile.remove(turnstileRef.current);
      } catch {
        
      }
    }
    if (geetestObjRef.current?.destroy) {
      try {
        geetestObjRef.current.destroy();
      } catch {
        
      }
      geetestObjRef.current = null;
    }
  }, [open]);

  const loadMathQuestion = useCallback(async () => {
    setMathLoading(true);
    const m = await fetchMathCaptcha();
    setMathLoading(false);
    if (m) {
      setMath(m);
      setMathAnswer('');
    }
  }, []);

  
  useEffect(() => {
    if (open && config?.mode === 'math') {
      loadMathQuestion();
    }
  }, [open, config, loadMathQuestion]);

  
  useEffect(() => {
    if (!open || !config || config.mode !== 'turnstile') return;
    let cancelled = false;
    (async () => {
      try {
        await loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js');
        if (cancelled) return;
        const w = window as unknown as {
          turnstile?: {
            render: (
              el: HTMLElement,
              opts: Record<string, unknown>
            ) => void;
          };
        };
        if (!w.turnstile) {
          setTurnstileError(true);
          return;
        }
        if (turnstileRef.current) {
          w.turnstile.render(turnstileRef.current, {
            sitekey: config.turnstileSiteKey,
            callback: (token: string) => {
              if (cancelled) return;
              finish({ mode: 'turnstile', turnstileToken: token });
            },
            'error-callback': () => {
              if (!cancelled) setTurnstileError(true);
            },
            theme: theme.palette.mode,
          });
        }
      } catch {
        setTurnstileError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    
  }, [open, config]);

  
  useEffect(() => {
    if (!open || !config || config.mode !== 'geetest') return;
    let cancelled = false;
    (async () => {
      try {
        await loadScript('https://static.geetest.com/v4/gt4.js');
        if (cancelled) return;
        const w = window as unknown as {
          initGeetest4?: (
            opts: Record<string, unknown>,
            cb: (captchaObj: {
              onReady: (fn: () => void) => void;
              onSuccess: (fn: () => void) => void;
              onError: (fn: () => void) => void;
              onClose: (fn: () => void) => void;
              showCaptcha: () => void;
              destroy: () => void;
              getValidate: () =>
                | { lot_number: string; captcha_output: string; pass_token: string; gen_time: string }
                | undefined;
            }) => void
          ) => void;
        };
        if (!w.initGeetest4) {
          setGeetestError(true);
          return;
        }
        w.initGeetest4({ captchaId: config.geetestCaptchaId, product: 'bind' }, (captchaObj) => {
          if (cancelled) return;
          geetestObjRef.current = captchaObj;
          captchaObj.onReady(() => {
            if (cancelled) return;
            setGeetestReady(true);
            
            if (!inline) captchaObj.showCaptcha();
          });
          captchaObj.onClose(() => {
            
            setGeetestLoading(false);
          });
          captchaObj.onSuccess(() => {
            setGeetestLoading(false);
            const v = captchaObj.getValidate();
            if (!v) return;
            finish({
              mode: 'geetest',
              lotNumber: v.lot_number,
              captchaOutput: v.captcha_output,
              passToken: v.pass_token,
              genTime: v.gen_time,
            });
          });
          captchaObj.onError(() => {
            if (!cancelled) {
              setGeetestError(true);
              setGeetestLoading(false);
            }
          });
        });
      } catch {
        setGeetestError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    
  }, [open, config]);

  const handleMathSubmit = () => {
    const trimmed = mathAnswer.trim();
    if (!math || trimmed === '') return;
    const num = Number(trimmed);
    if (!Number.isFinite(num)) return;
    finish({ mode: 'math', mathToken: math.token, mathAnswer: num });
  };

  const mode = config?.mode || 'none';

  const renderBody = () => {
    if (loadingConfig) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>

      );
    }

    if (mode === 'math') {
      return (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
            请计算以下算式的结果：{math ? <b>{math.question} = ?</b> : '...'}

          </Typography>

          {math ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', maxWidth: 340 }}>
              <TextField
                type="number"
                placeholder="输入答案"
                value={mathAnswer}
                onChange={(e) => setMathAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleMathSubmit();
                }}
                size="small"
                fullWidth
                autoFocus
                sx={{ flex: 1 }}
              />
              <Button
                type="button"
                variant="contained"
                size="small"
                disabled={mathAnswer.trim() === ''}
                onClick={handleMathSubmit}
                sx={{ whiteSpace: 'nowrap', minWidth: 96 }}
              >
                提交答案
              </Button>

            </Box>

          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>

          )}
          <Button
            type="button"
            size="small"
            onClick={loadMathQuestion}
            disabled={mathLoading}
            sx={{ textTransform: 'none' }}
          >
            换一题
          </Button>

        </>

      );
    }

    if (mode === 'turnstile') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', minHeight: 65, justifyContent: 'center' }}>
          <div ref={turnstileRef} />
          {turnstileError && (
            <Typography variant="body2" color="error" sx={{ textAlign: 'center', mt: 1 }}>
              验证加载失败，请关闭后重试
            </Typography>

          )}
        </Box>

      );
    }

    if (mode === 'geetest') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 1 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => trigger()}
            disabled={!geetestReady || geetestLoading}
            startIcon={geetestLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
            sx={{ borderRadius: 1, fontWeight: 700, minWidth: 180 }}
          >
            {!geetestReady ? '验证加载中...' : geetestLoading ? '验证中...' : '点击验证'}
          </Button>

          {geetestError && (
            <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
              验证加载失败，请重试
            </Typography>

          )}
        </Box>

      );
    }

    return null;
  };

  if (inline) {
    
    return (
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mt: 0.5, mb: 0.5 }}>
        {renderBody()}
      </Box>

    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Grow}
      BackdropProps={{ 'aria-hidden': false }}
      PaperProps={{ sx: { borderRadius: 1, width: '100%', maxWidth: 360 } }}
    >
      <DialogContent sx={{ px: 3, py: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
          安全验证
        </Typography>

        {renderBody()}
      </DialogContent>

    </Dialog>

  );
  }
);
