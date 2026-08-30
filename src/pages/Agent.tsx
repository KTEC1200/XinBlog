import { useCallback } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AgentConversationList } from '@/components/Agent/AgentConversationList';
import { useAgentDialogs } from '@/hooks/useAgentChat';
import { useSiteStore } from '@/stores/siteStore';


export default function Agent() {
  const navigate = useNavigate();
  const site = useSiteStore();
  const { dialogs, createDialog, renameDialog, deleteDialog } = useAgentDialogs(false);

  const handleCreate = useCallback(() => {
    const id = createDialog();
    navigate(`/agent/${id}`);
  }, [createDialog, navigate]);

  const handleSelect = useCallback((id: string) => navigate(`/agent/${id}`), [navigate]);

  if (!site.loaded) {
    return (
      <Box sx={{ height: '100%', p: 3 }}>
        <Skeleton variant="rectangular" height={96} sx={{ borderRadius: 2, mb: 1.5 }} />
        <Skeleton variant="rectangular" height={96} sx={{ borderRadius: 2, mb: 1.5 }} />
        <Skeleton variant="rectangular" height={96} sx={{ borderRadius: 2 }} />
      </Box>

    );
  }

  if (site.config.agentEnabled !== true) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          AI 助手功能暂未开放，请先在后台开启后刷新。
        </Typography>

      </Box>

    );
  }

  return (
    <Box sx={{ height: '100%' }}>
      <AgentConversationList
        dialogs={dialogs}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onDelete={deleteDialog}
        onRename={renameDialog}
      />
    </Box>

  );
}