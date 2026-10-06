import { useEffect } from 'react';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface AdminFrameModalProps {
  open: boolean;
  
  src: string;
  onClose: () => void;
  
  onSaved?: () => void;
  title?: string;
}


export function AdminFrameModal({ open, src, onClose, onSaved, title }: AdminFrameModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: MessageEvent) => {
      if (e.data && e.data.type === 'admin-frame-saved') {
        onSaved?.();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [open, onSaved]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '95vw',
          height: '95vh',
          maxWidth: 'none',
          maxHeight: 'none',
          m: 0,
          p: 0,
          position: 'relative',
          overflow: 'hidden',
        },
      }}
    >
      <IconButton
        onClick={onClose}
        aria-label="关闭"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          bgcolor: 'background.paper',
          boxShadow: 1,
        }}
      >
        <CloseIcon />
      </IconButton>

      {open && (
        <DialogContent sx={{ p: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
          <iframe
            src={src}
            title={title ?? '管理后台'}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </DialogContent>

      )}
    </Dialog>

  );
}
