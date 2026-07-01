import { useNavigate } from 'react-router-dom';
import { MessageSquare, Users, Clock, TrendingUp, Bell, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import StatCard from '@/components/Dashboard/StatCard';
import RecentChats from '@/components/Dashboard/RecentChats';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-lg">V</span></div>
              <span className="text-xl font-semibold text-gray-800">Vuexy</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" /></button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><Settings size={20} /></button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.role || 'Admin'}</p>
                </div>
                <img src={user?.avatar || 'https://i.pravatar.cc/150?img=11'} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your chats today.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Messages" value="12,345" change="+12.5%" changeType="positive" icon={MessageSquare} iconColor="text-purple-600" iconBg="bg-purple-50" />
          <StatCard title="Active Contacts" value="48" change="+5.2%" changeType="positive" icon={Users} iconColor="text-blue-600" iconBg="bg-blue-50" />
          <StatCard title="Avg. Response Time" value="2.4m" change="-15.3%" changeType="positive" icon={Clock} iconColor="text-green-600" iconBg="bg-green-50" />
          <StatCard title="Engagement Rate" value="89.2%" change="+3.1%" changeType="positive" icon={TrendingUp} iconColor="text-orange-600" iconBg="bg-orange-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2"><RecentChats /></div>
          <div className="space-y-6">
            <div className="bg-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
              <p className="text-purple-100 text-sm mb-4">Connect with your team members and start chatting instantly.</p>
              <button onClick={() => navigate('/chat')} className="w-full py-2.5 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors">Open Chat</button>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity</h3>
              <div className="space-y-4">
                {[{ label: 'Messages Sent', value: 85, color: 'bg-purple-600' }, { label: 'Messages Received', value: 92, color: 'bg-blue-500' }, { label: 'Files Shared', value: 24, color: 'bg-green-500' }].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={'h-full ' + item.color + ' rounded-full transition-all'} style={{ width: item.value + '%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
