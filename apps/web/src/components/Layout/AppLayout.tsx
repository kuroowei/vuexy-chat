import { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Sidebar from './Sidebar';
import ContactList from '../Chat/ContactList';
import ChatWindow from '../Chat/ChatWindow';
import MobileNav from './MobileNav';

export default function AppLayout() {
  const [activeContact, setActiveContact] = useState<string | null>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');

  const showContactList = isDesktop || !activeContact;
  const showChat = isDesktop || !!activeContact;

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {(isDesktop || isTablet) && <Sidebar />}
      {showContactList && (
        <ContactList 
          onSelectContact={(id) => setActiveContact(id)}
          activeContact={activeContact}
          className="flex-shrink-0 w-80"
        />
      )}
      {showChat && (
        <ChatWindow 
          contactId={activeContact}
          onBack={() => setActiveContact(null)}
          className="flex-1"
        />
      )}
      {!isDesktop && !isTablet && <MobileNav />}
    </div>
  );
}
