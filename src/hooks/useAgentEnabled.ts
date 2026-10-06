import { useEffect } from 'react';
import { useAgentStore } from '@/stores/agentStore';


export function useAgentEnabled() {
  const agentEnabled = useAgentStore((s) => s.agentEnabled);
  const init = useAgentStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return agentEnabled;
}