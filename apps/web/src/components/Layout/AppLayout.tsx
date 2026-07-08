import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Sidebar from './Sidebar';
import ContactList from '../Chat/ContactList';
import ChatWindow from '../Chat/ChatWindow';
import MobileNav from './MobileNav';
import ContactsPage from '../Pages/ContactsPage';
import CallsPage from '../Pages/CallsPage';
import SettingsHubPage from '../Pages/SettingsHubPage';
import ProfileViewPage from '../Pages/ProfileViewPage';
import ActiveCallPage from '../Pages/ActiveCallPage';

type MobileView = 'chat' | 'contacts' | 'calls' | 'settings' | 'profile';

interface ActiveCall {
  contactId: string;
  type: 'audio' | 'video';
}

export default function AppLayout() {
  const location = useLocation();
  const [activeContact, setActiveContact] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');

  // Sync mobileView with route on desktop
  useEffect(() => {
    const path = location.pathname;
    if (path === '/contacts') setMobileView('contacts');
    else if (path === '/calls') setMobileView('calls');
    else if (path === '/settings') setMobileView('settings');
    else if (path === '/profile') setMobileView('profile');
    else setMobileView('chat');
  }, [location.pathname]);

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

  // Handle selecting a contact
  const handleSelectContact = (id: string) => {
    setActiveContact(id);
    setMobileView('chat');
    setSidebarOpen(false);
  };

  // Handle back from chat
  const handleBack = () => {
    setActiveContact(null);
    setMobileView('chat');
  };

  // Handle starting a call
  const handleStartCall = (contactId: string, type: 'audio' | 'video') => {
    setActiveCall({ contactId, type });
  };

  // Handle ending a call
  const handleEndCall = () => {
    setActiveCall(null);
  };

  // Handle bottom nav
  const handleToggleChat = () => {
    setMobileView('chat');
    setActiveContact(null);
  };

  const handleToggleContacts = () => {
    setMobileView('contacts');
    setActiveContact(null);
  };

  const handleToggleCalls = () => {
    setMobileView('calls');
    setActiveContact(null);
  };

  const handleToggleSettings = () => {
    setMobileView('settings');
    setActiveContact(null);
  };

  const handleNavigateToProfile = () => {
    setMobileView('profile');
  };

  // Determine what to show
  const isMobile = !isDesktop && !isTablet;

  // If there's an active call, show call screen
  if (activeCall) {
    return (
      <div className="h-screen flex bg-gray-900 overflow-hidden">
        <ActiveCallPage 
          contactId={activeCall.contactId} 
          callType={activeCall.type} 
          onEndCall={handleEndCall} 
        />
      </div>
    );
  }

  const showSidebar = isDesktop || isTablet || sidebarOpen;
  const showContactList = isDesktop || (isTablet && !activeContact) || (mobileView === 'chat' && !activeContact && isMobile);
  const showChat = isDesktop || (isTablet && !!activeContact) || (!!activeContact && mobileView === 'chat' && isMobile);
  const showContactsPage = mobileView === 'contacts';
  const showCallsPage = mobileView === 'calls';
  const showSettingsPage = mobileView === 'settings';
  const showProfilePage = mobileView === 'profile';

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden relative">
      {/* Sidebar - slides in on mobile */}
      {showSidebar && (
        <div className={`
          ${isDesktop || isTablet ? 'relative flex-shrink-0' : 'fixed inset-y-0 left-0 z-[55] w-64'}
          ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}
          transition-transform duration-300 ease-in-out
        `}>
          {isMobile && sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-[-1] backdrop-blur-mobile" 
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Contact List (Chat tab) */}
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

      {/* Contacts Page */}
      {showContactsPage && (
        <div className="flex-1 h-full pb-mobile-nav">
          <ContactsPage 
            onStartCall={handleStartCall}
            onStartChat={handleSelectContact}
          />
        </div>
      )}

      {/* Calls Page */}
      {showCallsPage && (
        <div className="flex-1 h-full pb-mobile-nav">
          <CallsPage />
        </div>
      )}

      {/* Settings Hub Page */}
      {showSettingsPage && (
        <div className="flex-1 h-full pb-mobile-nav">
          <SettingsHubPage onNavigateToProfile={handleNavigateToProfile} />
        </div>
      )}

      {/* Profile Page */}
      {showProfilePage && (
        <div className="flex-1 h-full pb-mobile-nav">
          <ProfileViewPage onBack={handleToggleSettings} />
        </div>
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onToggleChat={handleToggleChat}
          onToggleContacts={handleToggleContacts}
          onToggleCalls={handleToggleCalls}
          onToggleSettings={handleToggleSettings}
          activeView={mobileView === 'profile' ? 'settings' : mobileView}
          sidebarOpen={sidebarOpen}
        />
      )}
    </div>
  );
}
