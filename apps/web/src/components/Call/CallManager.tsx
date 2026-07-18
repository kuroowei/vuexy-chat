import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

const getAvatarUrl = (avatar: string | null): string => {
  if (!avatar) return '';
  if (avatar.startsWith('http') || avatar.startsWith('data:')) return avatar;
  if (avatar.startsWith('/')) return `${BACKEND_URL}${avatar}`;
  return `${BACKEND_URL}/${avatar}`;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function CallManager() {
  const {
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
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (callType === 'video' && remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (callType === 'audio' && remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callType]);

  if (callStatus === 'idle' || callStatus === 'ended') return null;

  if (callStatus === 'ringing' && incomingCall) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 w-80 text-center shadow-2xl">
          <img
            src={getAvatarUrl(incomingCall.callerAvatar)}
            alt={incomingCall.callerName}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(incomingCall.callerName)}&background=7c3aed&color=fff&size=128&bold=true`;
            }}
          />
          <h2 className="text-xl font-bold text-gray-900">{incomingCall.callerName}</h2>
          <p className="text-sm text-gray-500 mb-6">
            Incoming {incomingCall.type === 'video' ? 'video' : 'audio'} call...
          </p>
          <div className="flex justify-center gap-6">
            <button
              onClick={declineCall}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors"
              title="Decline"
            >
              <PhoneOff size={24} />
            </button>
            <button
              onClick={acceptCall}
              className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg transition-colors"
              title="Accept"
            >
              <Phone size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isLive = callStatus === 'connected';

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center text-white">
      {callType === 'video' && isLive ? (
        <div className="relative w-full h-full">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-24 right-4 w-32 h-44 object-cover rounded-xl border-2 border-white shadow-lg"
          />
          <div className="absolute top-8 left-0 right-0 text-center">
            <h2 className="text-lg font-semibold">{remoteUserName}</h2>
            <p className="text-sm text-gray-300">{formatDuration(callDuration)}</p>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <img
            src={getAvatarUrl(remoteUserAvatar)}
            alt={remoteUserName || ''}
            className="w-28 h-28 rounded-full object-cover mx-auto mb-4"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteUserName || 'User')}&background=7c3aed&color=fff&size=128&bold=true`;
            }}
          />
          <h2 className="text-xl font-bold">{remoteUserName}</h2>
          <p className="text-sm text-gray-400 mt-2">
            {callStatus === 'calling' && 'Calling...'}
            {callStatus === 'connecting' && 'Connecting...'}
            {isLive && formatDuration(callDuration)}
          </p>
        </div>
      )}

      {callType === 'audio' && <audio ref={remoteAudioRef} autoPlay />}

      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
            isMuted ? 'bg-white text-gray-900' : 'bg-white/20 text-white'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {callType === 'video' && (
          <button
            onClick={toggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              isCameraOff ? 'bg-white text-gray-900' : 'bg-white/20 text-white'
            }`}
            title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
        )}

        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors"
          title="End call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}