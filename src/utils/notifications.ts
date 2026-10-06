


export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}


export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}


export function showNotification(title: string, body: string): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  let notification: Notification;
  try {
    notification = new Notification(
      title,
      {
        body,
        tag: 'chat-room-message',
        
        
        renotify: true,
      } as NotificationOptions
    );
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    
  }
}