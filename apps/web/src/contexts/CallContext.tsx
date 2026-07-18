import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';

// Free public STUN + TURN servers from the Open Relay Project.
// Good for testing/demo use; for real production traffic with guaranteed
// uptime, switch to a paid provider (Twilio, Metered.ca, Xirsys) using
// your own credentials instead.
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};

export type CallStatus =
  | 'idle'
  | 'calling'      // I initiated, waiting for callee to answer
  | 'ringing'      // Someone is calling me
  | 'connected'    // Call is live
  | 'ended';

interface IncomingCallInfo {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  type: 'audio' | 'video';
}

interface CallContextType {
  callStatus: CallStatus;
  callType: 'audio' | 'video' | null;
  incomingCall: IncomingCallInfo | null;
  remoteUserName: string | null;
  remoteUserAvatar: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  callDuration: number; // seconds, ticking while connected
  startCall: (calleeId: string, calleeName: string, calleeAvatar: string, type: 'audio' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within a CallProvider');
  return ctx;
}

export function CallProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
  const [remoteUserName, setRemoteUserName] = useState<string | null>(null);
  const [remoteUserAvatar, setRemoteUserAvatar] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const clearDurationTimer = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  };

  const cleanupMedia = useCallback(() => {
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    pcRef.current?.close();
    pcRef.current = null;
    pendingCandidatesRef.current = [];
    clearDurationTimer();
  }, [localStream]);

  const resetCallState = useCallback(() => {
    cleanupMedia();
    setCallStatus('idle');
    setCallType(null);
    setIncomingCall(null);
    setRemoteUserName(null);
    setRemoteUserAvatar(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
    currentCallIdRef.current = null;
    remoteUserIdRef.current = null;
  }, [cleanupMedia]);

  const createPeerConnection = useCallback(
    (targetUserId: string) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc:ice-candidate', {
            targetUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          endCall();
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [socket]
  );

  const getMedia = async (type: 'audio' | 'video') => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    });
    setLocalStream(stream);
    return stream;
  };

  // ---- Outgoing call ----
  const startCall = useCallback(
    async (calleeId: string, calleeName: string, calleeAvatar: string, type: 'audio' | 'video') => {
      if (!socket || !user) return;

      try {
        setCallType(type);
        setRemoteUserName(calleeName);
        setRemoteUserAvatar(calleeAvatar);
        remoteUserIdRef.current = calleeId;
        setCallStatus('calling');

        const stream = await getMedia(type);
        const pc = createPeerConnection(calleeId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        socket.emit('call:invite', { calleeId, type });

        socket.once('call:ringing', ({ callId }: { callId: string }) => {
          currentCallIdRef.current = callId;
        });

        socket.once('call:unavailable', () => {
          resetCallState();
        });

        socket.once('call:declined', () => {
          resetCallState();
        });

        socket.once('call:accepted', async () => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc:offer', { targetUserId: calleeId, offer });
        });
      } catch (err) {
        console.error('startCall error:', err);
        resetCallState();
      }
    },
    [socket, user, createPeerConnection, resetCallState]
  );

  // ---- Incoming call ----
  const acceptCall = useCallback(async () => {
    if (!socket || !incomingCall) return;

    try {
      currentCallIdRef.current = incomingCall.callId;
      remoteUserIdRef.current = incomingCall.callerId;
      setRemoteUserName(incomingCall.callerName);
      setRemoteUserAvatar(incomingCall.callerAvatar);
      setCallType(incomingCall.type);

      const stream = await getMedia(incomingCall.type);
      const pc = createPeerConnection(incomingCall.callerId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      socket.emit('call:accept', { callId: incomingCall.callId });
      setIncomingCall(null);
      setCallStatus('connected');
    } catch (err) {
      console.error('acceptCall error:', err);
      resetCallState();
    }
  }, [socket, incomingCall, createPeerConnection, resetCallState]);

  const declineCall = useCallback(() => {
    if (!socket || !incomingCall) return;
    socket.emit('call:decline', { callId: incomingCall.callId });
    setIncomingCall(null);
    setCallStatus('idle');
  }, [socket, incomingCall]);

  const endCall = useCallback(() => {
    if (socket && currentCallIdRef.current) {
      socket.emit('call:end', { callId: currentCallIdRef.current });
    }
    setCallStatus('ended');
    resetCallState();
  }, [socket, resetCallState]);

  const toggleMute = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOff((prev) => !prev);
  }, [localStream]);

  // ---- Socket event listeners (incoming call + WebRTC signaling) ----
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: IncomingCallInfo) => {
      // If already on a call, silently decline the new one (no call-waiting support yet)
      if (callStatus !== 'idle') {
        socket.emit('call:decline', { callId: data.callId });
        return;
      }
      setIncomingCall(data);
      setCallStatus('ringing');
    };

    const handleWebrtcOffer = async ({ fromUserId, offer }: any) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Apply any ICE candidates that arrived before the remote description was set
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc:answer', { targetUserId: fromUserId, answer });
    };

    const handleWebrtcAnswer = async ({ answer }: any) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      setCallStatus('connected');
    };

    const handleIceCandidate = async ({ candidate }: any) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (!pc.remoteDescription) {
        // Remote description not set yet — queue it
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    };

    const handleCallEnded = () => {
      resetCallState();
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('webrtc:offer', handleWebrtcOffer);
    socket.on('webrtc:answer', handleWebrtcAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('webrtc:offer', handleWebrtcOffer);
      socket.off('webrtc:answer', handleWebrtcAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('call:ended', handleCallEnded);
    };
  }, [socket, callStatus, resetCallState]);

  // ---- Duration timer, starts once truly connected ----
  useEffect(() => {
    if (callStatus === 'connected') {
      clearDurationTimer();
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearDurationTimer();
      if (callStatus === 'idle') setCallDuration(0);
    }
    return clearDurationTimer;
  }, [callStatus]);

  return (
    <CallContext.Provider
      value={{
        callStatus,
        callType,
        incomingCall,
        remoteUserName,
        remoteUserAvatar,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        callDuration,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}