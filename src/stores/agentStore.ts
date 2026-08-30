import { create } from 'zustand';
import { fetchAgentEnabled } from '@/api/ai';

interface AgentStore {
  agentEnabled: boolean;
  loaded: boolean;
  init: () => Promise<void>;
  setAgentEnabled: (v: boolean) => void;
}


export const useAgentStore = create<AgentStore>((set, get) => ({
  agentEnabled: false,
  loaded: false,
  init: async () => {
    if (get().loaded) return;
    const v = await fetchAgentEnabled();
    set({ agentEnabled: v, loaded: true });
  },
  setAgentEnabled: (v) => set({ agentEnabled: v, loaded: true }),
}));