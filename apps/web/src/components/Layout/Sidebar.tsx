import { NavLink, useNavigate } from 'react-router-dom';
import { ProfileDropdown } from '@/components/UI/ProfileDropdown';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  GraduationCap, 
  Truck, 
  Mail, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Users, 
  Shield, 
  File, 
  Lock, 
  Wand2, 
  AlertTriangle,
  Type,
  Image,
  ChevronRight,
  LogOut,
  Phone,
  Settings
} from 'lucide-react';

const mainNavItems = [
  { icon: <LayoutDashboard size={18} />, label: 'Dashboards', path: '/dashboards', badge: 5 },
  { icon: <FileText size={18} />, label: 'Front Pages', path: '/front-pages' },
  { icon: <ShoppingCart size={18} />, label: 'Ecommerce', path: '/ecommerce' },
  { icon: <GraduationCap size={18} />, label: 'Academy', path: '/academy' },
  { icon: <Truck size={18} />, label: 'Logistics', path: '/logistics' },
  { icon: <Mail size={18} />, label: 'Email', path: '/email' },
  { icon: <MessageSquare size={18} />, label: 'Chat', path: '/chat', badge: 2 },
  { icon: <Users size={18} />, label: 'Contacts', path: '/contacts' },
  { icon: <Phone size={18} />, label: 'Calls', path: '/calls' },
  { icon: <Calendar size={18} />, label: 'Calendar', path: '/calendar' },
  { icon: <FileText size={18} />, label: 'Invoice', path: '/invoice' },
  { icon: <Users size={18} />, label: 'User', path: '/user' },
  { icon: <Shield size={18} />, label: 'Roles & Permissions', path: '/roles' },
  { icon: <File size={18} />, label: 'Pages', path: '/pages' },
  { icon: <Lock size={18} />, label: 'Authentication', path: '/auth' },
  { icon: <Wand2 size={18} />, label: 'Wizard Examples', path: '/wizard' },
  { icon: <AlertTriangle size={18} />, label: 'Modal Examples', path: '/modal' },
];

const uiElements = [
  { icon: <Type size={18} />, label: 'Typography', path: '/typography' },
  { icon: <Image size={18} />, label: 'Icons', path: '/icons' },
];

const settingsItems = [
  { icon: <Settings size={18} />, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold text-lg">V</span>
        </div>
        <span className="text-xl font-semibold text-gray-800">Vuexy</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              'flex items-center px-3 py-2.5 rounded-lg mb-1 transition-colors relative ' +
              (isActive ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100')
            }
          >
            <span className="mr-3">{item.icon}</span>
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            {item.badge && (
              <span className={'text-xs px-2 py-0.5 rounded-full ' +
                (item.path === '/chat' ? 'bg-purple-600 text-white' : 'bg-red-500 text-white')
              }>
                {item.badge}
              </span>
            )}
            {item.label === 'Dashboards' && <ChevronRight size={14} />}
          </NavLink>
        ))}

        <div className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Settings
        </div>
        {settingsItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              'flex items-center px-3 py-2.5 rounded-lg mb-1 transition-colors ' +
              (isActive ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100')
            }
          >
            <span className="mr-3">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}

        <div className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          UI Elements
        </div>
        {uiElements.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              'flex items-center px-3 py-2.5 rounded-lg mb-1 transition-colors ' +
              (isActive ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100')
            }
          >
            <span className="mr-3">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <ProfileDropdown />
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2.5 rounded-lg mt-3 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200 hover:border-red-200 cursor-pointer"
        >
          <LogOut size={18} className="mr-3" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
