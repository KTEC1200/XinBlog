import { useCallback, useEffect, useRef, useState } from 'react';



const RING_TIMEOUT_MS = 20000; 
const ENDING_CLEANUP_MS = 2500; 
const DISCONNECT_GRACE_MS = 6000; 
const CONNECT_TIMEOUT_MS = 15000; 







const STUN_SERVERS = [
  'stun:stun.miwifi.com:3478',
  'stun:stun.chat.bilibili.com:3478',
  'stun:stun.l.google.com:19302',
  'stun:stun.cloudflare.com:3478',
];

export type CallState = 'idle' | 'dialing' | 'ringing' | 'connecting' | 'connected' | 'ending';

export type CallKind = 'audio' | 'video';

function genCallId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}


function mediaConstraints(kind: CallKind): MediaStreamConstraints {
  return kind === 'video'
    ? { audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } }
    : { audio: true };
}

export interface VoiceCallHandlers {
  state: CallState;
  
  kind: CallKind;
  
  peerName: string;
  
  muted: boolean;
  
  cameraMuted: boolean;
  
  durationSec: number;
  
  endedNote: string;
  
  remoteStream: MediaStream | null;
  
  localStream: MediaStream | null;
  
  startCall: (peerName: string, kind?: CallKind) => void;
  
  accept: () => void;
  
  reject: () => void;
  
  hangup: () => void;
  
  toggleMute: () => void;
  
  toggleCamera: () => void;
  
  handleSignal: (data: Record<string, unknown>) => void;
}

interface UseVoiceCallOptions {
  
  selfName: string;
  
  sendSignal: (payload: Record<string, unknown>) => boolean;
  
  connected: boolean;
}

export function useVoiceCall({ selfName, sendSignal, connected }: UseVoiceCallOptions): VoiceCallHandlers {
  const [state, setState] = useState<CallState>('idle');
  const [kind, setKind] = useState<CallKind>('audio');
  const [peerName, setPeerName] = useState('');
  const [muted, setMuted] = useState(false);
  const [cameraMuted, setCameraMuted] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [endedNote, setEndedNote] = useState('');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  
  const stateRef = useRef<CallState>('idle');
  const roleRef = useRef<'caller' | 'callee' | null>(null);
  const callIdRef = useRef<string | null>(null);
  const peerRef = useRef<string>('');
  const kindRef = useRef<CallKind>('audio');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const discTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectedAtRef = useRef(0);
  const mutedRef = useRef(false);
  const cameraMutedRef = useRef(false);
  const selfNameRef = useRef(selfName);
  const sendSignalRef = useRef(sendSignal);
  const duringEndingRef = useRef(false);
  
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    selfNameRef.current = selfName;
  }, [selfName]);
  useEffect(() => {
    sendSignalRef.current = sendSignal;
  }, [sendSignal]);

  const setCallState = useCallback((s: CallState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  
  const flushPendingIce = useCallback(() => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    const queue = pendingIceRef.current;
    if (!queue.length) return;
    pendingIceRef.current = [];
    queue.forEach((c) => {
      try { void pc.addIceCandidate(new RTCIceCandidate(c)); } catch {  }
    });
  }, []);

  
  const signal = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    const to = peerRef.current;
    if (!to) return;
    sendSignalRef.current({ type, to, callId: callIdRef.current ?? '', ...payload });
  }, []);

  const stopLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
  }, []);

  const destroyPeer = useCallback(() => {
    const pc = pcRef.current;
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      pcRef.current = null;
      pendingIceRef.current = []; 
    }
  }, []);

  const clearCallTimers = useCallback(() => {
    if (ringTimerRef.current) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
    if (discTimerRef.current) {
      clearTimeout(discTimerRef.current);
      discTimerRef.current = null;
    }
    if (connectTimerRef.current) {
      clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  
  const endCall = useCallback(
    (note: string | null = null) => {
      duringEndingRef.current = true;
      clearCallTimers();
      destroyPeer();
      stopLocalStream();
      roleRef.current = null;
      callIdRef.current = null;
      peerRef.current = '';
      kindRef.current = 'audio';
      setKind('audio');
      mutedRef.current = false;
      setMuted(false);
      cameraMutedRef.current = false;
      setCameraMuted(false);
      setDurationSec(0);
      setPeerName('');
      setRemoteStream(null);
      setLocalStream(null);
      if (note) {
        setEndedNote(note);
        setCallState('ending');
        setTimeout(() => {
          duringEndingRef.current = false;
          setEndedNote('');
          setCallState('idle'); 
        }, ENDING_CLEANUP_MS);
      } else {
        duringEndingRef.current = false;
        setEndedNote('');
        setCallState('idle');
      }
    },
    [clearCallTimers, destroyPeer, stopLocalStream, setCallState, duringEndingRef]
  );

  
  const armConnectTimeout = useCallback(() => {
    if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    connectTimerRef.current = setTimeout(() => {
      if (stateRef.current === 'connecting' || stateRef.current === 'dialing') {
        endCall('连接超时，请重试');
      }
    }, CONNECT_TIMEOUT_MS);
  }, [endCall]);

  const beginConnected = useCallback(() => {
    clearCallTimers();
    connectedAtRef.current = Date.now();
    setDurationSec(0);
    setCallState('connected');
    durationTimerRef.current = setInterval(() => {
      setDurationSec(Math.floor((Date.now() - connectedAtRef.current) / 1000));
    }, 1000);
  }, [clearCallTimers, setCallState]);

  
  const createPeer = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: STUN_SERVERS }] });
    pc.onicecandidate = (e) => {
      if (e.candidate && callIdRef.current) {
        signal('signal.ice', { candidate: e.candidate.toJSON() });
      }
    };
    pc.ontrack = (e) => {
      if (e.streams?.[0]) setRemoteStream(e.streams[0]);
    };
    pc.onconnectionstatechange = () => {
      const cs = pc.connectionState;
      if (cs === 'connected') {
        if (pcRef.current === pc) beginConnected();
      } else if (cs === 'disconnected') {
        
        if (pcRef.current !== pc) return;
        if (discTimerRef.current) clearTimeout(discTimerRef.current);
        discTimerRef.current = setTimeout(() => {
          if (pcRef.current === pc && pc.connectionState === 'disconnected') {
            endCall('连接失败');
          }
        }, DISCONNECT_GRACE_MS);
      }
    };
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed' && pcRef.current === pc) {
        endCall('连接失败');
      }
    };
    pcRef.current = pc;
    return pc;
  }, [signal, beginConnected, endCall]);

  
  const startOutgoingMedia = useCallback(async () => {
    setCallState('connecting'); 
    armConnectTimeout();
    if (!navigator.mediaDevices?.getUserMedia) {
      endCall('当前环境不支持媒体采集');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints(kindRef.current));
      localStreamRef.current = stream;
      setLocalStream(stream);
      mutedRef.current = false;
      setMuted(false);
      cameraMutedRef.current = false;
      setCameraMuted(false);
      const pc = createPeer();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signal('signal.offer', { sdp: pc.localDescription });
    } catch {
      signal('call.hangup');
      endCall('无法访问麦克风或摄像头，通话已取消');
    }
  }, [createPeer, signal, endCall, armConnectTimeout, setCallState]);

  
  const handleAnswer = useCallback(async (sdp: unknown) => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp as RTCSessionDescriptionInit));
      flushPendingIce(); 
    } catch {
      
      endCall('协商失败');
    }
  }, [flushPendingIce, endCall]);

  
  const handleOffer = useCallback(async (sdp: unknown) => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp as RTCSessionDescriptionInit));
      flushPendingIce(); 
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signal('signal.answer', { sdp: pc.localDescription });
    } catch {
      endCall('协商失败');
    }
  }, [signal, endCall, flushPendingIce]);

  
  const handleIce = useCallback((candidate: unknown) => {
    const pc = pcRef.current;
    if (!pc || !candidate) return;
    try {
      if (pc.remoteDescription) {
        void pc.addIceCandidate(new RTCIceCandidate(candidate as RTCIceCandidateInit));
      } else {
        pendingIceRef.current.push(candidate as RTCIceCandidateInit); 
      }
    } catch {
      
    }
  }, []);

  
  useEffect(() => {
    if (!connected && stateRef.current !== 'idle' && stateRef.current !== 'ending') {
      clearCallTimers();
      destroyPeer();
      stopLocalStream();
      roleRef.current = null;
      callIdRef.current = null;
      peerRef.current = '';
      setPeerName('');
      setDurationSec(0);
      setRemoteStream(null);
      setCallState('idle');
    }
  }, [connected, clearCallTimers, destroyPeer, stopLocalStream, setCallState]);

  
  useEffect(
    () => () => {
      clearCallTimers();
      destroyPeer();
      stopLocalStream();
    },
    [clearCallTimers, destroyPeer, stopLocalStream]
  );

  
  const handleSignal = useCallback(
    (data: Record<string, unknown>) => {
      const type = String(data.type ?? '');
      const from = data.from as string | undefined;
      const callId = data.callId as string | undefined;
      const self = selfNameRef.current;
      if (from && from === self) return; 
      if (data.to && String(data.to) !== self) return; 
      if (!from) return;

      switch (type) {
        case 'call.invite': {
          if (stateRef.current !== 'idle') {
            signal('call.busy');
            return;
          }
          roleRef.current = 'callee';
          peerRef.current = from;
          callIdRef.current = callId ?? genCallId();
          kindRef.current = data.kind === 'video' ? 'video' : 'audio';
          setKind(kindRef.current);
          setPeerName(from);
          setCallState('ringing');
          if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
          ringTimerRef.current = setTimeout(() => {
            signal('call.timeout');
            endCall('对方未接听，已取消');
          }, RING_TIMEOUT_MS);
          return;
        }
        case 'call.accept': {
          if (roleRef.current !== 'caller' || callIdRef.current !== callId) return;
          if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
          startOutgoingMedia();
          return;
        }
        case 'call.reject': {
          if (roleRef.current !== 'caller' || callIdRef.current !== callId) return;
          if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
          endCall('对方已拒绝');
          return;
        }
        case 'call.busy': {
          if (roleRef.current !== 'caller' || callIdRef.current !== callId) return;
          if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
          endCall(data.reason === 'offline' ? '对方已离线' : '对方正忙');
          return;
        }
        case 'call.timeout': {
          if (roleRef.current !== 'caller' || callIdRef.current !== callId) return;
          if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
          endCall('对方未接听');
          return;
        }
        case 'call.hangup': {
          if (callIdRef.current !== callId) return;
          endCall('对方已挂断');
          return;
        }
        case 'signal.offer': {
          if (roleRef.current !== 'callee' || callIdRef.current !== callId) return;
          handleOffer(data.sdp);
          return;
        }
        case 'signal.answer': {
          if (roleRef.current !== 'caller' || callIdRef.current !== callId) return;
          handleAnswer(data.sdp);
          return;
        }
        case 'signal.ice': {
          if (callIdRef.current !== callId) return;
          handleIce(data.candidate);
          return;
        }
        default:
          return;
      }
    },
    [signal, startOutgoingMedia, handleOffer, handleAnswer, handleIce, endCall, setPeerName, setCallState]
  );

  const startCall = useCallback(
    (name: string, kind: CallKind = 'audio') => {
      if (stateRef.current !== 'idle') return;
      if (!name || name === selfNameRef.current) return;
      roleRef.current = 'caller';
      peerRef.current = name;
      callIdRef.current = genCallId();
      kindRef.current = kind;
      setKind(kind);
      setPeerName(name);
      setCallState('dialing');
      signal('call.invite', { kind });
      if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
      ringTimerRef.current = setTimeout(() => {
        if (stateRef.current === 'dialing') {
          signal('call.timeout');
          endCall('对方未接听，已取消');
        }
      }, RING_TIMEOUT_MS);
    },
    [signal, endCall, setPeerName, setCallState]
  );

  const accept = useCallback(async () => {
    if (stateRef.current !== 'ringing') return;
    if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
    setCallState('connecting'); 
    armConnectTimeout();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints(kindRef.current));
      localStreamRef.current = stream;
      setLocalStream(stream);
      mutedRef.current = false;
      setMuted(false);
      cameraMutedRef.current = false;
      setCameraMuted(false);
      const pc = createPeer();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      signal('call.accept');
    } catch {
      signal('call.reject');
      endCall('无法访问麦克风或摄像头，已自动拒绝');
    }
  }, [signal, createPeer, endCall, armConnectTimeout, setCallState]);

  const reject = useCallback(() => {
    if (stateRef.current !== 'ringing') return;
    if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
    signal('call.reject');
    endCall();
  }, [signal, endCall]);

  const hangup = useCallback(() => {
    if (stateRef.current === 'idle' || stateRef.current === 'ending') return;
    signal('call.hangup');
    endCall();
  }, [signal, endCall]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    if (kindRef.current !== 'video') return;
    const next = !cameraMutedRef.current;
    cameraMutedRef.current = next;
    setCameraMuted(next);
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
  }, []);

  return {
    state,
    kind,
    peerName,
    muted,
    cameraMuted,
    durationSec,
    endedNote,
    remoteStream,
    localStream,
    startCall,
    accept,
    reject,
    hangup,
    toggleMute,
    toggleCamera,
    handleSignal,
  };
}