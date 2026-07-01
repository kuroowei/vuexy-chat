import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const recentChats = [
  { id: '1', name: 'Gavin Griffith', message: 'I will purchase it for sure. 👍', time: '2m ago', avatar: 'https://i.pravatar.cc/150?img=12', unread: 1 },
  { id: '2', name: 'Harriet McBride', message: 'If it takes long you can mail me...', time: '1h ago', avatar: 'https://i.pravatar.cc/150?img=5', unread: 0 },
  { id: '3', name: 'Danny Conner', message: 'Soufflé soufflé caramels sweet roll...', time: '3h ago', avatar: 'https://i.pravatar.cc/150?img=3', unread: 0 },
];

export default function RecentChats() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Recent Chats</h3>
        <button onClick={() => navigate('/chat')} className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
          View All<ArrowRight size={16} />
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {recentChats.map((chat) => (
          <button key={chat.id} onClick={() => navigate('/chat')} className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
            <div className="relative">
              <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full object-cover" />
              {chat.unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{chat.unread}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="text-sm font-medium text-gray-900 truncate">{chat.name}</h4>
                <span className="text-xs text-gray-400 flex-shrink-0">{chat.time}</span>
              </div>
              <p className="text-sm text-gray-500 truncate">{chat.message}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
