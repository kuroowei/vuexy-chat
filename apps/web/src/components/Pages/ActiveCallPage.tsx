import { Phone, Video, Mic, MicOff, Camera, CameraOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { useEffect } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';

interface ActiveCallPageProps {
  contactId: string;
  callType: 'audio' | 'video';
  onEndCall: () => void;
}

const demoContacts: Record<string, { name: string; avatar: string }> = {
  '1': { name: 'Gavin Griffith', avatar: 'https://i.pravatar.cc/150?u=1' },
  '2': { name: 'Harriet McBride', avatar: 'https://i.pravatar.cc/150?u=2' },
  '3': { name: 'Danny Conner', avatar: 'https://i.pravatar.cc/150?u=3' },
  '4': { name: 'Janie West', avatar: 'https://i.pravatar.cc/150?u=4' },
  '5': { name: 'Bryan Murray', avatar: 'https://i.pravatar.cc/150?u=5' },
  '6': { name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?u=6' },
  '7': { name: 'Mike Chen', avatar: 'https://i.pravatar.cc/150?u=7' },
  '8': { name: 'Emma Wilson', avatar: 'https://i.pravatar.cc/150?u=8' },
};

export default function ActiveCallPage({ contactId, callType, onEndCall }: ActiveCallPageProps) {
  const {
    isInCall,
    isMuted,
    isVideoOn,
    isSpeakerOn,
    duration,
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    formatDuration,
    error,
  } = useWebRTC();

  const contact = demoContacts[contactId] || { name: 'Unknown', avatar: 'https://i.pravatar.cc/150?u=0' };

  // Start call when component mounts
  useEffect(() => {
    startCall(callType);
  }, [callType, startCall]);

  const handleEndCall = () => {
    endCall();
    onEndCall();
  };

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-white p-8">
        <div className="text-red-400 mb-4">
          <PhoneOff size={48} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Call Failed</h2>
        <p className="text-gray-400 text-center mb-6">{error}</p>
        <button 
          onClick={handleEndCall}
          className="px-6 py-3 bg-purple-600 rounded-xl font-medium hover:bg-purple-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 to-gray-900" />

      {/* Video streams */}
      {callType === 'video' && (
        <>
          {/* Remote video (full screen background) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover ${isVideoOn ? 'opacity-100' : 'opacity-0'}`}
          />
          
          {/* Local video (picture-in-picture) */}
          <div className="absolute top-20 right-4 w-32 h-44 bg-gray-800 rounded-2xl overflow-hidden border-2 border-white/20 z-20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        </>
      )}

      {/* Audio-only avatar display */}
      {callType === 'audio' && (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1">
          <div className="relative">
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
            />
            {duration === 0 && (
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-ping" />
            )}
          </div>
          <h2 className="mt-6 text-2xl font-bold text-white">{contact.name}</h2>
          <p className="text-white/70 mt-2">
            {duration === 0 ? 'Calling...' : formatDuration(duration)}
          </p>
        </div>
      )}

      {/* Video call info overlay */}
      {callType === 'video' && (
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
            <div className={`w-2 h-2 rounded-full ${duration > 0 ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            <span className="text-white text-xs font-medium">
              {duration === 0 ? 'Calling...' : formatDuration(duration)}
            </span>
          </div>
          <h2 className="text-white font-semibold mt-2 ml-1">{contact.name}</h2>
        </div>
      )}

      {/* Call Controls */}
      <div className="relative z-20 p-8 pb-24">
        <div className="flex justify-center gap-6">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${
              isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
            }`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {/* Speaker */}
          <button
            onClick={toggleSpeaker}
            className={`p-4 rounded-full transition-colors ${
              isSpeakerOn ? 'bg-purple-600 text-white' : 'bg-white/20 text-white'
            }`}
          >
            {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>

          {/* Video toggle (video call only) */}
          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-colors ${
                !isVideoOn ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
              }`}
            >
              {isVideoOn ? <Camera size={24} /> : <CameraOff size={24} />}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
