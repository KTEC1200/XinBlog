import { useCallback, useEffect, useRef, useState } from 'react';
import { isNotificationSupported, requestNotificationPermission } from '@/utils/notifications';

const STORAGE_KEY = 'chat-notifications-enabled';

export type ChatNotificationPermission = NotificationPermission | 'unsupported';

export interface UseChatNotificationsResult {
  
  supported: boolean;
  
  enabled: boolean;
  
  permission: ChatNotificationPermission;
  
  setEnabled: (value: boolean) => void;
}


export function useChatNotifications(): UseChatNotificationsResult {
  const supported = isNotificationSupported();

  const [permission, setPermission] = useState<ChatNotificationPermission>(() =>
    supported ? Notification.permission : 'unsupported'
  );

  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  
  const setEnabledRef = useRef<(value: boolean) => void>(() => {});
  useEffect(() => {
    setEnabledRef.current = (value: boolean) => {
      if (!supported) return;
      setEnabled(value);
      try {
        localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
      } catch {
        
      }
    };
  }, [supported]);

  const setEnabledSafe = useCallback(
    (value: boolean) => {
      if (!supported) return;
      setEnabledRef.current(value);
      
      if (value && Notification.permission !== 'granted') {
        void requestNotificationPermission().then((next) => {
          setPermission(next as NotificationPermission);
          if (next !== 'granted') {
            setEnabled(false);
            try {
              localStorage.setItem(STORAGE_KEY, '0');
            } catch {
              
            }
          }
        });
      }
    },
    [supported]
  );

  return { supported, enabled, permission, setEnabled: setEnabledSafe };
}