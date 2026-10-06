import { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AgentPanel from '@/components/Agent/AgentPanel';
import { useAgentDialogs } from '@/hooks/useAgentChat';
import { fetchAiSettings, fetchAiModels, isTextAiModel } from '@/api/ai';

export type AgentMode = 'warm' | 'humorous' | 'professional';
const MODE_KEY = 'xinblog.agent.persona';
const MODEL_KEY = 'xinblog.agent.model';
const AUTO_COLLAPSE_KEY = 'xinblog.agent.autoCollapse';
interface ModelOption {
  id: string;
  name: string;
  alias?: string;
}


export default function AgentChat() {
  const navigate = useNavigate();
  const { dialogId } = useParams();
  const { dialogs, activeDialog, messages, loading, selectDialog, send, ensureDialog, confirmAction, undoAction } = useAgentDialogs(false);
  const [mode, setMode] = useState<AgentMode>(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem(MODE_KEY)) || '';
    return saved === 'warm' || saved === 'humorous' || saved === 'professional' ? saved : 'warm';
  });
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  
  const [agentAvatar, setAgentAvatar] = useState<string>('');
  
  const [autoCollapse, setAutoCollapse] = useState<boolean>(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem(AUTO_COLLAPSE_KEY)) || '';
    return saved === null ? true : saved !== '0';
  });

  
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await fetchAiSettings();
      const list = await fetchAiModels();
      if (cancelled) return;
      setAgentAvatar(settings?.agentAvatar || '');
      const textModels: ModelOption[] = (list || [])
        .filter((m) => isTextAiModel(m.id))
        .map((m) => ({ id: m.id, name: m.name || m.id }));
      setModelOptions(textModels);
      
      const savedModel = (typeof localStorage !== 'undefined' && localStorage.getItem(MODEL_KEY)) || '';
      const defaultModel =
        (settings && textModels.some((m) => m.id === settings.model) ? settings.model : '') ||
        (textModels.some((m) => m.id === savedModel) ? savedModel : '') ||
        (textModels[0] ? textModels[0].id : '');
      setSelectedModel(defaultModel);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const changeMode = (m: AgentMode) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      
    }
  };

  const changeModel = (m: string) => {
    setSelectedModel(m);
    try {
      localStorage.setItem(MODEL_KEY, m);
    } catch {
      
    }
  };

  const changeAutoCollapse = (v: boolean) => {
    setAutoCollapse(v);
    try {
      localStorage.setItem(AUTO_COLLAPSE_KEY, v ? '1' : '0');
    } catch {
      
    }
  };

  
  useEffect(() => {
    if (!dialogId) return;
    selectDialog(dialogId);
    const d = dialogs.find((x) => x.id === dialogId) ?? null;
    if (!d && /^dlg-/.test(dialogId)) ensureDialog(dialogId);
  }, [dialogId, dialogs, selectDialog, ensureDialog]);

  
  const dialog = activeDialog ?? (dialogId ? dialogs.find((d) => d.id === dialogId) ?? null : null);

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {!dialog ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              对话不存在
            </Typography>

            <Typography variant="body2" color="text.secondary">
              该对话可能已被删除。
            </Typography>

            <Button component={Link} to="/agent" variant="contained" sx={{ textTransform: 'none', px: 3, mt: 1 }}>
              返回对话列表
            </Button>

          </Box>

        ) : (
          <AgentPanel
            title={dialog.title}
            loading={loading}
            messages={messages}
            mode={mode}
            modelOptions={modelOptions}
            selectedModel={selectedModel}
            onModeChange={changeMode}
            onModelChange={changeModel}
            autoCollapse={autoCollapse}
            onAutoCollapseChange={changeAutoCollapse}
            agentAvatar={agentAvatar}
            onConfirmAction={confirmAction}
            onUndoAction={undoAction}
            onSend={(text) => send(text, undefined, mode, selectedModel || undefined)}
            onBack={() => navigate('/agent')}
          />
        )}
      </Box>

    </Box>

  );
}