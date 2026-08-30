import { useCallback, useEffect, useRef, useState } from 'react';
import { buildChatWebSocketUrl, checkGuestNickname } from '@/api/chat';
import { getToken } from '@/utils/token';


export interface ChatMessageEntry {
  id: number;
  kind: 'message' | 'system';
  name?: string;
  content: string;
  timestamp?: number;
  
  recalled?: boolean;
}

export type ChatStatus = 'connecting' | 'open' | 'closed' | 'error';


export const RECALL_WINDOW_MS = 5 * 60 * 1000;

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT = 5;
const MAX_NAME_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 2000;



const CALL_SIGNAL_TYPES = new Set([
  'call.invite',
  'call.accept',
  'call.reject',
  'call.busy',
  'signal.offer',
  'signal.answer',
  'signal.ice',
  'call.hangup',
  'call.timeout',
]);

const TYPING_THROTTLE_MS = 1600;

const TYPING_TTL_MS = 4000;

function sanitizeName(raw: string): string {
  const trimmed = (raw || '').trim().slice(0, MAX_NAME_LENGTH);
  return trimmed || '匿名';
}

function normalizeTimestamp(raw: string | number): number | undefined {
  
  const t = typeof raw === 'number' ? raw : Date.parse(raw);
  return Number.isFinite(t) ? t : undefined;
}

export interface UseChatRoomOptions {
  roomKey: string;
  userName: string;
  
  auth?: boolean;
  
  onMessage?: (entry: ChatMessageEntry) => void;
  
  onSignal?: (data: Record<string, unknown>) => void;
}

export function useChatRoom({ roomKey, userName, auth = false, onMessage, onSignal }: UseChatRoomOptions) {
  const [status, setStatus] = useState<ChatStatus>('connecting');
  const [error, setError] = useState<string>('');
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessageEntry[]>([]);
  
  
  const [onlineNames, setOnlineNames] = useState<string[]>([]);
  
  
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const idRef = useRef(0);
  const reconnectRef = useRef(0);
  const closedByUserRef = useRef(false);
  const onlineSetRef = useRef(new Set<string>());
  
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  
  const onSignalRef = useRef(onSignal);
  useEffect(() => {
    onSignalRef.current = onSignal;
  }, [onSignal]);

  
  const initialNameRef = useRef(userName);
  
  const selfNameRef = useRef(userName);
  
  const acceptedRef = useRef(false);
  
  const renameResolverRef = useRef<((ok: boolean) => void) | null>(null);
  const [nameRejected, setNameRejected] = useState(false);
  
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const typingTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  
  const lastTypingSentRef = useRef(0);

  const clearTyping = useCallback((raw: string) => {
    const name = sanitizeName(raw);
    if (!name) return;
    const timer = typingTimersRef.current.get(name);
    if (timer) clearTimeout(timer);
    typingTimersRef.current.delete(name);
    setTypingNames((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : prev));
  }, []);

  const addTyping = useCallback(
    (raw: string) => {
      const name = sanitizeName(raw);
      if (!name) return;
      
      if (name === sanitizeName(selfNameRef.current)) return;
      clearTyping(name);
      setTypingNames((prev) => (prev.includes(name) ? prev : [...prev, name]));
      typingTimersRef.current.set(
        name,
        setTimeout(() => {
          typingTimersRef.current.delete(name);
          setTypingNames((prev) => prev.filter((n) => n !== name));
        }, TYPING_TTL_MS)
      );
    },
    [clearTyping]
  );

  const applyOnlineChange = useCallback(
    (name: string, present: boolean) => {
      const set = onlineSetRef.current;
      set[present ? 'add' : 'delete'](name);
      setOnlineNames(Array.from(set));
    },
    []
  );

  const nextId = useCallback(() => {
    idRef.current += 1;
    return idRef.current;
  }, []);

  const appendSystem = useCallback(
    (text: string) => {
      setMessages((prev) => [...prev, { id: nextId(), kind: 'system' as const, content: text }]);
    },
    [nextId]
  );

  
  
  
  const buildHistoryEntries = useCallback(
    (items: unknown[]): ChatMessageEntry[] =>
      items
        .map((it) => {
          const raw = (it ?? {}) as Record<string, unknown>;
          return {
            id: nextId(),
            kind: 'message' as const,
            name: sanitizeName(String(raw.name ?? '')),
            content: String(raw.message ?? ''),
            timestamp: normalizeTimestamp(raw.timestamp as string | number),
          };
        })
        .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)),
    [nextId]
  );

  const connect = useCallback(() => {
    if (closedByUserRef.current) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStatus('connecting');
    
    const loggedIn = !!getToken();
    const token = auth || loggedIn ? getToken() : undefined;
    
    
    const nickname = auth || loggedIn ? undefined : sanitizeName(initialNameRef.current);
    const ws = new WebSocket(buildChatWebSocketUrl(roomKey, token, nickname));
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('open');
      setConnected(true);
      setError('');
      setNameRejected(false);
      acceptedRef.current = false;
      
      const myName = sanitizeName(initialNameRef.current);
      selfNameRef.current = myName;
      onlineSetRef.current.clear();
      
      onlineSetRef.current.add(myName);
      setOnlineNames([myName]);
      ws.send(JSON.stringify({ name: myName }));
    };

    ws.onmessage = (ev) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(String(ev.data));
      } catch {
        return;
      }

      
      
      if (typeof data.type === 'string' && CALL_SIGNAL_TYPES.has(data.type)) {
        onSignalRef.current?.(data);
        return;
      }

      if (data.ready === true) {
        
        
        acceptedRef.current = true;
        setNameRejected(false);
        const resolve = renameResolverRef.current;
        renameResolverRef.current = null;
        resolve?.(true);
        return;
      }
      if (data.error) {
        
        if (data.code === 'name_taken' || data.code === 'name_invalid') {
          setError(String(data.error));
          if (!acceptedRef.current) setNameRejected(true);
          const resolve = renameResolverRef.current;
          renameResolverRef.current = null;
          resolve?.(false);
          return;
        }
        
        
        if (data.code === 409) {
          setError(String(data.error));
          if (!acceptedRef.current) {
            setNameRejected(true);
            closedByUserRef.current = true;
          }
          const resolve = renameResolverRef.current;
          renameResolverRef.current = null;
          resolve?.(false);
          return;
        }
        setError(String(data.error));
        return;
      }
      if (data.renamed === true) {
        
        const newName = sanitizeName(String(data.name ?? ''));
        selfNameRef.current = newName;
        initialNameRef.current = newName;
        acceptedRef.current = true;
        setError('');
        const resolve = renameResolverRef.current;
        renameResolverRef.current = null;
        resolve?.(true);
        return;
      }
      if (typeof data.joined === 'string') {
        appendSystem(`${data.joined} 加入聊天`);
        applyOnlineChange(data.joined, true);
        return;
      }
      if (typeof data.quit === 'string') {
        appendSystem(`${data.quit} 离开聊天`);
        applyOnlineChange(data.quit, false);
        return;
      }
      
      if (data.history && typeof data.history === 'object') {
        const h = data.history as { items?: unknown[]; hasMore?: boolean };
        const entries = buildHistoryEntries(Array.isArray(h.items) ? h.items : []);
        setMessages((prev) => [...prev, ...entries]);
        setHasMoreHistory(Boolean(h.hasMore));
        return;
      }
      
      if (data.historyOlder && typeof data.historyOlder === 'object') {
        const h = data.historyOlder as { items?: unknown[]; hasMore?: boolean };
        setLoadingOlder(false);
        const entries = buildHistoryEntries(Array.isArray(h.items) ? h.items : []);
        setMessages((prev) => [...entries, ...prev]);
        setHasMoreHistory(Boolean(h.hasMore));
        return;
      }
      if (typeof data.message === 'string') {
        const entry: ChatMessageEntry = {
          id: nextId(),
          kind: 'message' as const,
          name: sanitizeName(String(data.name ?? '')),
          content: String(data.message),
          timestamp: normalizeTimestamp(data.timestamp as string | number),
        };
        setMessages((prev) => [...prev, entry]);
        
        if (entry.name) clearTyping(entry.name);
        
        if (entry.name && entry.name !== sanitizeName(selfNameRef.current)) {
          onMessageRef.current?.(entry);
        }
        return;
      }
      
      if (typeof data.typing === 'string') {
        addTyping(data.typing);
        return;
      }
      
      if (typeof data.recalled === 'number') {
        setMessages((prev) =>
          prev.map((m) => (m.timestamp === data.recalled ? { ...m, recalled: true } : m))
        );
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (closedByUserRef.current) {
        setStatus('closed');
        return;
      }
      setError('');
      
      if (reconnectRef.current < MAX_RECONNECT) {
        reconnectRef.current += 1;
        setTimeout(connect, RECONNECT_DELAY);
      } else {
        setStatus('error');
      }
    };

    ws.onerror = () => {
      setError('连接出错了，正在重试…');
    };
  }, [roomKey, auth, applyOnlineChange, appendSystem, buildHistoryEntries, nextId, addTyping, clearTyping]);

  useEffect(() => {
    closedByUserRef.current = false;
    reconnectRef.current = 0;
    setMessages([]);
    setError('');
    connect();
    return () => {
      closedByUserRef.current = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      const ws = wsRef.current;
      if (!trimmed || !ws || ws.readyState !== WebSocket.OPEN) return false;
      ws.send(JSON.stringify({ message: trimmed.slice(0, MAX_MESSAGE_LENGTH) }));
      return true;
    },
    []
  );

  
  const sendSignal = useCallback((payload: Record<string, unknown>): boolean => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  }, []);

  
  const sendTyping = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return;
    lastTypingSentRef.current = now;
    ws.send(JSON.stringify({ typing: true }));
  }, []);

  const recallMessage = useCallback(
    (timestamp: number) => {
      const ws = wsRef.current;
      
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      if (!Number.isFinite(timestamp) || Date.now() - timestamp > RECALL_WINDOW_MS) return false;
      ws.send(JSON.stringify({ recall: timestamp }));
      return true;
    },
    []
  );

  
  const loadOlder = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || loadingOlder) return;
    let before: number | undefined;
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (m.kind === 'message' && typeof m.timestamp === 'number') {
        before = m.timestamp;
        break;
      }
    }
    if (before === undefined) return;
    setLoadingOlder(true);
    ws.send(JSON.stringify({ getOlder: before }));
  }, [messages, loadingOlder]);

  
  const setNickname = useCallback(
    async (nickname: string): Promise<boolean> => {
      const trimmed = nickname.trim();
      if (!trimmed) return false;
      if (renameResolverRef.current) return false; 
      const ws = wsRef.current;
      const isOpen = !!ws && ws.readyState === WebSocket.OPEN;

      if (!isOpen) {
        
        return new Promise<boolean>((resolve) => {
          renameResolverRef.current = resolve;
          closedByUserRef.current = false;
          initialNameRef.current = trimmed;
          selfNameRef.current = trimmed;
          connect();
        });
      }

      if (acceptedRef.current) {
        
        const check = await checkGuestNickname(trimmed);
        if (!check.ok) {
          setError(check.message || '该昵称已被占用');
          return false;
        }
      }

      return new Promise<boolean>((resolve) => {
        renameResolverRef.current = resolve;
        ws.send(JSON.stringify(acceptedRef.current ? { rename: trimmed } : { name: trimmed }));
      });
    },
    [connect]
  );

  return { status, connected, error, messages, hasMoreHistory, loadingOlder, loadOlder, sendMessage, sendSignal, sendTyping, typingNames, recallMessage, setNickname, nameRejected, onlineNames };
}