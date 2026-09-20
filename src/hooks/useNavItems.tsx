import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Link as LinkIcon } from '@mui/icons-material';
import { useSiteStore } from '@/stores/siteStore';
import { useAuthStore } from '@/stores/authStore';
import { isContentAdmin } from '@/utils/permission';
import { useMessageWallEnabled } from '@/hooks/useMessageWallEnabled';
import { useChatEnabled } from '@/hooks/useChatEnabled';
import { builtinNavItems, type BuiltinNavItem } from '@/components/Frame/navItems';
export interface TopNavItem {
  id: string;
  title: string;
  url: string;
  icon?: ReactNode;
  color?: string;
  openInNewTab?: boolean;
}
export function useBuiltinNavItems(): BuiltinNavItem[] {
  const { config } = useSiteStore();
  const { user } = useAuthStore();
  const messageWallEnabled = useMessageWallEnabled();
  const chatEnabled = useChatEnabled();
  const agentEnabled = config.agentEnabled === true && isContentAdmin(user?.role);
  return useMemo(
    () =>
      builtinNavItems.filter((item) => {
        if (item.path === '/friends' && !config.friends?.enabled) return false;
        if (item.path === '/music' && !config.music?.showPage) return false;
        if (item.path === '/message-wall' && !messageWallEnabled) return false;
        if (item.path === '/chat' && !chatEnabled) return false;
        if (item.path === '/agent' && !agentEnabled) return false;
        return true;
      }),
    [config.friends?.enabled, config.music?.showPage, messageWallEnabled, chatEnabled, agentEnabled]
  );
}
export function useTopNavItems(): TopNavItem[] {
  const builtin = useBuiltinNavItems();
  const { config } = useSiteStore();
  const custom = config.nav?.items;
  return useMemo(() => {
    const builtinItems: TopNavItem[] = builtin.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.path,
      icon: item.icon,
      openInNewTab: false,
    }));
    const customItems: TopNavItem[] = (custom || []).map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      icon: <LinkIcon fontSize="small" />,
      color: item.color,
      openInNewTab: item.openInNewTab,
    }));
    return [...builtinItems, ...customItems];
  }, [builtin, custom]);
}