import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useCall } from '@/contexts/CallContext';
import Sidebar from './Sidebar';
import ContactList from '../Chat/ContactList';
import ChatWindow from '../Chat/ChatWindow';
import MobileNav from './MobileNav';
import ContactsPage from '../Pages/ContactsPage';
import CallsPage from '../Pages/CallsPage';
import SettingsHubPage from '../Pages/SettingsHubPage';
import ProfileViewPage from '../Pages/ProfileViewPage';

type MobileView = 'chat' | 'contacts' | 'calls' | 'settings' | 'profile';

export default function AppLayout() {
  const location = useLocation();
  const { startCall } = useCall();
  const [activeContact, setActiveContact] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    const path = location.pathname;
    if (path === '/contacts') setMobileView('contacts');
    else if (path === '/calls') setMobileView('calls');
    else if (path === '/settings') setMobileView('settings');
    else if (path === '/profile') setMobileView('profile');
    else setMobileView('chat');
  }, [location.pathname]);

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

  const handleSelectContact = (id: string) => {
    setActiveContact(id);
    setMobileView('chat');
    setSidebarOpen(false);
  };

  const handleBack = () => {
    setActiveContact(null);
    setMobileView('chat');
  };

  const handleStartCall = (
    contactId: string,
    contactName: string,
    contactAvatar: string,
    type: 'audio' | 'video'
  ) => {
    startCall(contactId, contactName, contactAvatar, type);
  };

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

  const isMobile = !isDesktop && !isTablet;

  // DESKTOP: Show different views based on route
  if (isDesktop || isTablet) {
    if (mobileView === 'contacts') {
      return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
          <Sidebar />
          <div className="flex-1 h-full">
            <ContactsPage onStartCall={handleStartCall} onStartChat={handleSelectContact} />
          </div>
        </div>
      );
    }
    if (mobileView === 'calls') {
      return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
          <Sidebar />
          <div className="flex-1 h-full">
            <CallsPage />
          </div>
        </div>
      );
    }
    if (mobileView === 'settings') {
      return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
          <Sidebar />
          <div className="flex-1 h-full">
            <SettingsHubPage onNavigateToProfile={handleNavigateToProfile} />
          </div>
        </div>
      );
    }
    if (mobileView === 'profile') {
      return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
          <Sidebar />
          <div className="flex-1 h-full">
            <ProfileViewPage onBack={handleToggleSettings} />
          </div>
        </div>
      );
    }
    return (
      <div className="h-screen flex bg-gray-50 overflow-hidden">
        <Sidebar />
        <ContactList
          onSelectContact={handleSelectContact}
          activeContact={activeContact}
          onStartCall={handleStartCall}
          className="flex-shrink-0 w-80 h-full"
        />
        <ChatWindow
          contactId={activeContact}
          onBack={handleBack}
          className="flex-1 h-full"
        />
      </div>
    );
  }

  // MOBILE: Show one view at a time
  const showSidebar = sidebarOpen;
  const showContactList = mobileView === 'chat' && !activeContact;
  const showChat = !!activeContact && mobileView === 'chat';
  const showContactsPage = mobileView === 'contacts';
  const showCallsPage = mobileView === 'calls';
  const showSettingsPage = mobileView === 'settings';
  const showProfilePage = mobileView === 'profile';

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden relative">
      {showSidebar && (
        <div className="fixed inset-y-0 left-0 z-[55] w-64 translate-x-0 transition-transform duration-300 ease-in-out">
          <div
            className="fixed inset-0 bg-black/50 z-[-1] backdrop-blur-mobile"
            onClick={() => setSidebarOpen(false)}
          />
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {showContactList && (
        <ContactList
          onSelectContact={handleSelectContact}
          activeContact={activeContact}
          onStartCall={handleStartCall}
          className="flex-shrink-0 w-full h-full pb-mobile-nav"
        />
      )}

      {showChat && (
        <ChatWindow
          contactId={activeContact}
          onBack={handleBack}
          className="flex-1 h-full pb-mobile-nav"
        />
      )}

      {showContactsPage && (
        <div className="flex-1 h-full pb-mobile-nav">
          <ContactsPage onStartCall={handleStartCall} onStartChat={handleSelectContact} />
        </div>
      )}

      {showCallsPage && (
        <div className="flex-1 h-full pb-mobile-nav">
          <CallsPage />
        </div>
      )}

      {showSettingsPage && (
        <div className="flex-1 h-full pb-mobile-nav">
          <SettingsHubPage onNavigateToProfile={handleNavigateToProfile} />
        </div>
      )}

      {showProfilePage && (
        <div className="flex-1 h-full pb-mobile-nav">
          <ProfileViewPage onBack={handleToggleSettings} />
        </div>
      )}

      <MobileNav
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onToggleChat={handleToggleChat}
        onToggleContacts={handleToggleContacts}
        onToggleCalls={handleToggleCalls}
        onToggleSettings={handleToggleSettings}
        activeView={mobileView === 'profile' ? 'settings' : mobileView}
        sidebarOpen={sidebarOpen}
      />
    </div>
  );
}