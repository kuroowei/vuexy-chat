import { Search, Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

type CallType = 'audio' | 'video';
type CallStatus = 'incoming' | 'outgoing' | 'missed';

interface Call {
  id: string;
  name: string;
  avatar: string;
  type: CallType;
  status: CallStatus;
  time: string;
  duration: string;
}

const demoCalls: Call[] = [
  { id: '1', name: 'Gavin Griffith', avatar: 'https://i.pravatar.cc/150?u=1', type: 'video', status: 'incoming', time: '2 min ago', duration: '5:23' },
  { id: '2', name: 'Harriet McBride', avatar: 'https://i.pravatar.cc/150?u=2', type: 'audio', status: 'outgoing', time: '15 min ago', duration: '2:45' },
  { id: '3', name: 'Danny Conner', avatar: 'https://i.pravatar.cc/150?u=3', type: 'video', status: 'missed', time: '1 hour ago', duration: '' },
  { id: '4', name: 'Janie West', avatar: 'https://i.pravatar.cc/150?u=4', type: 'audio', status: 'incoming', time: '3 hours ago', duration: '12:08' },
  { id: '5', name: 'Bryan Murray', avatar: 'https://i.pravatar.cc/150?u=5', type: 'video', status: 'outgoing', time: 'Yesterday', duration: '8:15' },
  { id: '6', name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?u=6', type: 'audio', status: 'missed', time: 'Yesterday', duration: '' },
  { id: '7', name: 'Mike Chen', avatar: 'https://i.pravatar.cc/150?u=7', type: 'video', status: 'incoming', time: '2 days ago', duration: '3:42' },
];

const statusConfig = {
  incoming: { icon: PhoneIncoming, color: 'text-green-600', bg: 'bg-green-50' },
  outgoing: { icon: PhoneOutgoing, color: 'text-blue-600', bg: 'bg-blue-50' },
  missed: { icon: PhoneMissed, color: 'text-red-600', bg: 'bg-red-50' },
};

export default function CallsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'missed'>('all');

  const filteredCalls = activeTab === 'all' 
    ? demoCalls 
    : demoCalls.filter(c => c.status === 'missed');

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 pt-16 pb-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Calls</h1>
          <button className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700">
            <Phone size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('missed')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'missed' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Missed
          </button>
        </div>
      </div>

      {/* Call List */}
      <div className="flex-1 overflow-y-auto pb-20">
        {filteredCalls.map((call) => {
          const StatusIcon = statusConfig[call.status].icon;
          const statusColor = statusConfig[call.status].color;
          const statusBg = statusConfig[call.status].bg;

          return (
            <div
              key={call.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="relative">
                <img
                  src={call.avatar}
                  alt={call.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${statusBg}`}>
                  <StatusIcon size={12} className={statusColor} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{call.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  {call.type === 'video' ? <Video size={14} /> : <Phone size={14} />}
                  <span>{call.time}</span>
                  {call.duration && <span>· {call.duration}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2.5 text-purple-600 hover:bg-purple-50 rounded-full transition-colors">
                  <Phone size={18} />
                </button>
                <button className="p-2.5 text-purple-600 hover:bg-purple-50 rounded-full transition-colors">
                  <Video size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
