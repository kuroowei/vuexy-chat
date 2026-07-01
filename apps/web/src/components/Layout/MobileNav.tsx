import { MessageSquare, Users, Phone, Settings } from 'lucide-react';
import { useState } from 'react';

export default function MobileNav() {
  const [active, setActive] = useState('chat');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 flex justify-around items-center z-50">
      {[
        { id: 'chat', icon: MessageSquare, label: 'Chat' },
        { id: 'contacts', icon: Users, label: 'Contacts' },
        { id: 'calls', icon: Phone, label: 'Calls' },
        { id: 'settings', icon: Settings, label: 'Settings' },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setActive(item.id)}
          className={'flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ' + (active === item.id ? 'text-purple-600' : 'text-gray-400')}
        >
          <item.icon size={20} />
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
