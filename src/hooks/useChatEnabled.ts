import { useEffect, useState } from 'react';
import { getChatSettings } from '@/api/chat';


export function useChatEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getChatSettings().then((res) => {
      if (cancelled) return;
      if (res.code === 0 && res.data) setEnabled(res.data.enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}