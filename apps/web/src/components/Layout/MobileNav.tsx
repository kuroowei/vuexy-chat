import { MessageSquare, Users, Phone, Settings, Menu, X, MoreVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface MobileNavProps {
  onToggleSidebar: () => void;
  onToggleChat: () => void;
  onToggleContacts: () => void;
  onToggleCalls: () => void;
  onToggleSettings: () => void;
  activeView: string;
  sidebarOpen: boolean;
}

export default function MobileNav({
  onToggleSidebar,
  onToggleChat,
  onToggleContacts,
  onToggleCalls,
  onToggleSettings,
  activeView,
  sidebarOpen
}: MobileNavProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'Chat', onClick: onToggleChat },
    { id: 'contacts', icon: Users, label: 'Contacts', onClick: onToggleContacts },
    { id: 'calls', icon: Phone, label: 'Calls', onClick: onToggleCalls },
    { id: 'settings', icon: Settings, label: 'Settings', onClick: onToggleSettings },
  ];

  return (
    <>
      {/* Floating hamburger menu button */}
      <button
        onClick={onToggleSidebar}
        className="fixed top-4 left-4 z-[60] bg-purple-600 text-white p-2.5 rounded-xl shadow-lg hover:bg-purple-700 active:scale-95 transition-all lg:hidden"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Three-dot menu button (top right) */}
      <div className="fixed top-4 right-4 z-[60] lg:hidden" ref={menuRef}>
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="bg-white text-gray-700 p-2.5 rounded-xl shadow-lg hover:bg-gray-50 active:scale-95 transition-all"
        >
          <MoreVertical size={20} />
        </button>

        {/* Dropdown menu */}
        {showMoreMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => { onToggleSettings(); setShowMoreMenu(false); }}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
            >
              <Settings size={16} className="text-gray-500" />
              Settings
            </button>
            <button
              onClick={() => { onToggleContacts(); setShowMoreMenu(false); }}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
            >
              <Users size={16} className="text-gray-500" />
              New Group
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={() => { setShowMoreMenu(false); }}
              className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
            >
              <X size={16} />
              Close
            </button>
          </div>
        )}
      </div>

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-2 py-2 flex justify-around items-center z-50 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
