import { useState } from 'react';
import { Fab, Tooltip } from '@mui/material';
import { useAuthStore } from '@/stores/authStore';
import { isContentAdmin, isSuperAdmin } from '@/utils/permission';
import { AdminFrameModal } from './AdminFrameModal';

interface AdminFrameFabProps {
  
  adminPath: string;
  
  label: string;
  icon: React.ReactNode;
  
  requireSuper?: boolean;
  
  onSaved?: () => void;
  
  bottomOffset?: number;
}


export function AdminFrameFab({
  adminPath,
  label,
  icon,
  requireSuper,
  onSaved,
  bottomOffset = 0,
}: AdminFrameFabProps) {
  const role = useAuthStore((s) => s.user?.role);
  const allowed = requireSuper ? isSuperAdmin(role) : isContentAdmin(role);
  const [open, setOpen] = useState(false);

  if (!allowed) return null;

  return (
    <>
      <Tooltip title={label} placement="left">
        <Fab
          color="primary"
          aria-label={label}
          onClick={() => setOpen(true)}
          sx={{ position: 'fixed', right: 24, bottom: 24 + bottomOffset, zIndex: (theme) => theme.zIndex.speedDial }}
        >
          {icon}
        </Fab>

      </Tooltip>

      <AdminFrameModal
        open={open}
        src={adminPath}
        onClose={() => setOpen(false)}
        onSaved={onSaved}
        title={label}
      />
    </>

  );
}
