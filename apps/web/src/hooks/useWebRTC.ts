import { useState, useRef, useCallback, useEffect } from 'react';

interface CallState {
  isInCall: boolean;
  callType: 'audio' | 'video' | null;
  isMuted: boolean;
  isVideoOn: boolean;
  isSpeakerOn: boolean;
  duration: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  error: string | null;
}

export function useWebRTC() {
  const [state, setState] = useState<CallState>({
    isInCall: false,
    callType: null,
    isMuted: false,
    isVideoOn: true,
    isSpeakerOn: false,
    duration: 0,
    localStream: null,
    remoteStream: null,
    error: null,
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get user media (camera/microphone)
  const startCall = useCallback(async (type: 'audio' | 'video') => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video' ? { width: 1280, height: 720 } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      setState(prev => ({
        ...prev,
        isInCall: true,
        callType: type,
        isVideoOn: type === 'video',
        localStream: stream,
        error: null,
      }));

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

      // Set local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // In a real app, you would:
      // 1. Create RTCPeerConnection
      // 2. Add tracks to connection
      // 3. Create offer
      // 4. Send offer to remote peer via signaling server
      // 5. Wait for answer
      // 6. Exchange ICE candidates
      // 7. Establish connection

      // For demo, we'll simulate a remote stream after 2 seconds
      setTimeout(() => {
        // In production, this would be the remote peer's stream
        setState(prev => ({ ...prev, remoteStream: stream.clone() }));
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream.clone();
        }
      }, 2000);

    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to access camera/microphone',
      }));
    }
  }, []);

  // End call
  const endCall = useCallback(() => {
    // Stop all tracks
    state.localStream?.getTracks().forEach(track => track.stop());
    state.remoteStream?.getTracks().forEach(track => track.stop());

    // Close peer connection
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    // Clear timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    setState({
      isInCall: false,
      callType: null,
      isMuted: false,
      isVideoOn: true,
      isSpeakerOn: false,
      duration: 0,
      localStream: null,
      remoteStream: null,
      error: null,
    });
  }, [state.localStream, state.remoteStream]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const audioTracks = state.localStream?.getAudioTracks();
    audioTracks?.forEach(track => {
      track.enabled = !track.enabled;
    });
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, [state.localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    const videoTracks = state.localStream?.getVideoTracks();
    videoTracks?.forEach(track => {
      track.enabled = !track.enabled;
    });
    setState(prev => ({ ...prev, isVideoOn: !prev.isVideoOn }));
  }, [state.localStream]);

  // Toggle speaker (simulated)
  const toggleSpeaker = useCallback(() => {
    setState(prev => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    ...state,
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    formatDuration,
  };
}
