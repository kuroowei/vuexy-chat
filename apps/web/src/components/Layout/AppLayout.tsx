import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Sidebar from './Sidebar';
import ContactList from '../Chat/ContactList';
import ChatWindow from '../Chat/ChatWindow';
import MobileNav from './MobileNav';

type MobileView = 'chat' | 'contacts' | 'calls' | 'settings';

export default function AppLayout() {
  const [activeContact, setActiveContact] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen && !isDesktop && !isTablet) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [sidebarOpen, isDesktop, isTablet]);

  // Determine what to show
  const showSidebar = isDesktop || isTablet || sidebarOpen;
  const showContactList = isDesktop || (isTablet && !activeContact) || (mobileView === 'chat' && !activeContact && !isDesktop && !isTablet);
  const showChat = isDesktop || (isTablet && !!activeContact) || (!!activeContact && mobileView === 'chat' && !isDesktop && !isTablet);

  const handleSelectContact = (id: string) => {
    setActiveContact(id);
    setMobileView('chat');
    setSidebarOpen(false);
  };

  const handleBack = () => {
    setActiveContact(null);
    setMobileView('chat');
  };

  const handleToggleChat = () => {
    setMobileView('chat');
    setActiveContact(null);
  };

  const handleToggleContacts = () => {
    setMobileView('contacts');
    setActiveContact(null);
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden relative">
      {/* Sidebar - slides in on mobile */}
      {showSidebar && (
        <div className={`
          ${isDesktop || isTablet ? 'relative flex-shrink-0' : 'fixed inset-y-0 left-0 z-[55] w-64'}
          ${!isDesktop && !isTablet ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}
          transition-transform duration-300 ease-in-out
        `}>
          {!isDesktop && !isTablet && sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-[-1] backdrop-blur-mobile" 
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Contact List */}
      {showContactList && (
        <ContactList 
          onSelectContact={handleSelectContact}
          activeContact={activeContact}
          className="flex-shrink-0 w-full md:w-80 h-full pb-mobile-nav"
        />
      )}

      {/* Chat Window */}
      {showChat && (
        <ChatWindow 
          contactId={activeContact}
          onBack={handleBack}
          className="flex-1 h-full pb-mobile-nav"
        />
      )}

      {/* Mobile Navigation */}
      {!isDesktop && !isTablet && (
        <MobileNav
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onToggleChat={handleToggleChat}
          onToggleContacts={handleToggleContacts}
          onToggleCalls={() => setMobileView('calls')}
          onToggleSettings={() => setMobileView('settings')}
          activeView={mobileView}
          sidebarOpen={sidebarOpen}
        />
      )}
    </div>
  );
}
