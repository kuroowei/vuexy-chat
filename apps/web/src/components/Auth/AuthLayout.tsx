import { Link } from 'react-router-dom';
import { MessageSquare, Shield, Zap, Globe } from 'lucide-react';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden lg:flex lg:w-1/2 bg-purple-600 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-700 rounded-full translate-x-1/3 translate-y-1/3 opacity-50" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <MessageSquare size={28} className="text-purple-600" />
            </div>
            <span className="text-2xl font-bold">Vuexy Chat</span>
          </div>
          <h1 className="text-4xl font-bold mb-6 leading-tight">Connect with your team<br /><span className="text-purple-200">in real-time</span></h1>
          <p className="text-purple-100 text-lg mb-12 max-w-md">Experience seamless communication with our modern chat platform. Secure, fast, and built for teams.</p>
          <div className="grid grid-cols-2 gap-6">
            {[{ icon: <Shield size={24} />, label: 'Secure & Encrypted' }, { icon: <Zap size={24} />, label: 'Lightning Fast' }, { icon: <Globe size={24} />, label: 'Global Reach' }, { icon: <MessageSquare size={24} />, label: 'Team Chat' }].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">{f.icon}</div>
                <span className="text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center"><MessageSquare size={20} className="text-white" /></div>
            <span className="text-xl font-bold text-gray-900">Vuexy Chat</span>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-500">{subtitle}</p>
          </div>
          {children}
          <p className="mt-8 text-center text-sm text-gray-500">© 2026 Vuexy Chat. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
