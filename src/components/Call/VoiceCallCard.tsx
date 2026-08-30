import { useEffect, useRef, useState } from 'react';
import { alpha, Avatar, Box, Button, CircularProgress, Fade, IconButton, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import PhoneIcon from '@mui/icons-material/Phone';
import type { CallState } from '@/hooks/useVoiceCall';

interface VoiceCallCardProps {
  state: CallState;
  peerName: string;
  muted: boolean;
  durationSec: number;
  endedNote: string;
  remoteStream: MediaStream | null;
  onAccept: () => void;
  onReject: () => void;
  onHangup: () => void;
  onToggleMute: () => void;
}


function RemoteAudio({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && stream) el.srcObject = stream;
  }, [stream]);
  return <audio ref={ref} autoPlay />;
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface DragState {
  offX: number;
  offY: number;
}

export default function VoiceCallCard(props: VoiceCallCardProps) {
  const { state, peerName, muted, durationSec, endedNote, remoteStream, onAccept, onReject, onHangup, onToggleMute } = props;
  const { enqueueSnackbar } = useSnackbar();

  
  
  const show = state === 'dialing' || state === 'ringing' || state === 'connecting' || state === 'connected';
  const isDialing = state === 'dialing';
  const isRinging = state === 'ringing';
  const isConnecting = state === 'connecting';
  const isConnected = state === 'connected';

  
  useEffect(() => {
    if (state === 'ending') {
      enqueueSnackbar(endedNote || '通话已结束', { variant: 'info' });
    }
    
  }, [state === 'ending']);

  
  const windowRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const onHeaderPointerDown = (e: React.PointerEvent) => {
    const el = windowRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = { offX: rect.left - e.clientX, offY: rect.top - e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onHeaderPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const el = windowRef.current;
    if (!d || !el) return;
    let x = e.clientX + d.offX;
    let y = e.clientY + d.offY;
    const maxX = window.innerWidth - el.offsetWidth;
    const maxY = window.innerHeight - el.offsetHeight;
    x = Math.max(0, Math.min(x, Math.max(0, maxX)));
    y = Math.max(0, Math.min(y, Math.max(0, maxY)));
    setPos({ x, y });
  };
  const onHeaderPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <Fade in={show} timeout={220} unmountOnExit>
      <Box
        ref={windowRef}
        sx={{
          position: 'fixed',
          right: pos ? undefined : 16,
          bottom: pos ? undefined : 16,
          left: pos ? pos.x : undefined,
          top: pos ? pos.y : undefined,
          zIndex: 9999, 
          width: 320,
          borderRadius: 1, 
          overflow: 'hidden',
          bgcolor: 'background.paper', 
          border: '1px solid',
          borderColor: (t) => alpha(t.palette.divider, 0.9),
          boxShadow: (t) => `0 14px 38px ${alpha(t.palette.text.primary, 0.2)}`,
        }}
      >
        <RemoteAudio stream={remoteStream} />

        {}
        <Box
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 2,
            py: 1.25,
            cursor: 'grab',
            userSelect: 'none',
            touchAction: 'none',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.07),
          }}
        >
          <Avatar sx={{ width: 36, height: 36, fontSize: 16, bgcolor: 'primary.main' }}>
            {peerName?.[0]?.toUpperCase() || '?'}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {peerName || '…'}
            </Typography>

            {}
            {(isDialing || isConnecting) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mt: 0.2 }}>
                <CircularProgress size={11} thickness={6} color="primary" />
                <Typography variant="caption" color="primary.main" sx={{ lineHeight: 1 }}>
                  {isConnecting ? '正在接通…' : '正在连接…'}
                </Typography>

              </Box>

            )}
            {isRinging && (
              <Typography variant="caption" color="secondary.main" fontWeight={600} sx={{ lineHeight: 1 }}>
                来电…
              </Typography>

            )}
            {isConnected && (
              <Typography variant="caption" color="success.main" fontWeight={600} sx={{ lineHeight: 1 }}>
                通话中
              </Typography>

            )}
          </Box>

          {}
          <IconButton
            size="small"
            onClick={onToggleMute}
            onPointerDown={(e) => e.stopPropagation()}
            color={muted ? 'error' : 'default'}
            title={muted ? '取消静音' : '静音'}
            sx={{
              ...(muted
                ? { bgcolor: 'error.main', color: 'error.contrastText', '&:hover': { bgcolor: 'error.main' } }
                : { '&:hover': { bgcolor: (t) => alpha(t.palette.error.main, 0.12) } }),
            }}
          >
            {muted ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
          </IconButton>

        </Box>


        {}
        <Box
          sx={{
            px: 2,
            py: 0.6,
            bgcolor: isRinging
              ? (t) => alpha(t.palette.secondary.main, 0.08)
              : (t) => alpha(t.palette.background.default, 0.5),
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: isRinging ? 'secondary.main' : isConnected ? 'success.main' : 'text.secondary',
              fontWeight: 600,
            }}
          >
            {isDialing
              ? '等待对方接听…'
              : isConnecting
                ? '正在进行安全连接，请稍候…'
                : isRinging
                  ? '对方邀请你语音通话'
                  : isConnected
                    ? muted
                      ? `通话中 ${fmtDuration(durationSec)} · 你已静音`
                      : `通话中 ${fmtDuration(durationSec)}`
                    : '通话已结束'}
          </Typography>

        </Box>


        {}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, px: 2, py: 2 }}>
          {isRinging ? (
            <>
              <Button variant="contained" color="success" onClick={onAccept} startIcon={<PhoneIcon />} sx={{ textTransform: 'none', minWidth: 120, py: 0.8 }}>
                接听
              </Button>

              <Button variant="contained" color="error" onClick={onReject} startIcon={<CallEndIcon />} sx={{ textTransform: 'none', minWidth: 120, py: 0.8 }}>
                拒绝
              </Button>

            </>

          ) : isConnecting ? (
            
            <Button variant="contained" color="success" disabled startIcon={<CircularProgress size={16} color="inherit" />} sx={{ textTransform: 'none', minWidth: 160, py: 0.8 }}>
              正在接通…
            </Button>

          ) : (
            <IconButton
              onClick={onHangup}
              color="error"
              title={isConnected ? '挂断' : '取消'}
              sx={{ width: 56, height: 56, '&:hover': { bgcolor: (t) => alpha(t.palette.error.main, 0.12) } }}
            >
              <CallEndIcon fontSize="large" />
            </IconButton>

          )}
        </Box>

      </Box>

    </Fade>

  );
}