import { Phone, Video, Mic, MicOff, Camera, CameraOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');

  const contact = demoContacts[contactId] || { name: 'Unknown', avatar: 'https://i.pravatar.cc/150?u=0' };

  // Simulate call connecting
  useEffect(() => {
    const timer = setTimeout(() => {
      setCallStatus('connected');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Call duration timer
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (callStatus === 'ended') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-white">
        <p className="text-xl font-semibold">Call Ended</p>
        <p className="text-gray-400 mt-2">Duration: {formatDuration(callDuration)}</p>
        <button 
          onClick={onEndCall}
          className="mt-6 px-6 py-3 bg-purple-600 rounded-xl font-medium"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 to-gray-900" />

      {/* Video background (if video call) */}
      {callType === 'video' && isVideoOn && (
        <div className="absolute inset-0 bg-gray-800">
          <img 
            src={contact.avatar} 
            alt={contact.name}
            className="w-full h-full object-cover opacity-30 blur-sm"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 pt-16">
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
            <div className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            <span className="text-white text-xs font-medium">
              {callStatus === 'connecting' ? 'Connecting...' : formatDuration(callDuration)}
            </span>
          </div>
          {callType === 'video' && (
            <div className="w-24 h-32 bg-gray-800 rounded-2xl overflow-hidden border-2 border-white/20">
              <img 
                src="https://i.pravatar.cc/150?u=99" 
                alt="You"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Center - Contact Info */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative">
            <img
              src={contact.avatar}
              alt={contact.name}
              className={`w-28 h-28 rounded-full object-cover border-4 border-white/20 ${callStatus === 'connecting' ? 'animate-pulse' : ''}`}
            />
            {callStatus === 'connecting' && (
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-ping" />
            )}
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">{contact.name}</h2>
          <p className="text-white/70 mt-1">
            {callStatus === 'connecting' ? 'Calling...' : 'On call'}
          </p>
        </div>

        {/* Call Controls */}
        <div className="p-8 pb-24">
          <div className="flex justify-center gap-6">
            {/* Mute */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full transition-colors ${
                isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
              }`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* Speaker */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-4 rounded-full transition-colors ${
                isSpeakerOn ? 'bg-purple-600 text-white' : 'bg-white/20 text-white'
              }`}
            >
              {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>

            {/* Video toggle (video call only) */}
            {callType === 'video' && (
              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-4 rounded-full transition-colors ${
                  !isVideoOn ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
                }`}
              >
                {isVideoOn ? <Camera size={24} /> : <CameraOff size={24} />}
              </button>
            )}

            {/* End Call */}
            <button
              onClick={() => { setCallStatus('ended'); setTimeout(onEndCall, 2000); }}
              className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
