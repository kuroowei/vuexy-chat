import { Link } from 'react-router-dom';
import { MessageSquare, Shield, Zap, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-lg">V</span></div>
              <span className="text-xl font-semibold text-gray-800">Vuexy Chat</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign In</Link>
              <Link to="/register" className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium mb-8">
            <Zap size={16} />Now with real-time messaging
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">Modern team chat for<br /><span className="text-purple-600">modern teams</span></h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">Connect, collaborate, and communicate with your team in real-time. Secure, fast, and beautifully designed.</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register" className="px-8 py-3.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center gap-2">Start Free Trial<ArrowRight size={18} /></Link>
            <Link to="/login" className="px-8 py-3.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">Sign In</Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[{ icon: <MessageSquare size={24} />, title: 'Real-time Messaging', desc: 'Instant message delivery with typing indicators and read receipts.' }, { icon: <Shield size={24} />, title: 'End-to-End Encryption', desc: 'Your conversations are secure with industry-standard encryption.' }, { icon: <Users size={24} />, title: 'Team Collaboration', desc: 'Group chats, file sharing, and team management tools.' }].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-gray-500">Start free, upgrade when you need to.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[{ name: 'Free', price: '', features: ['Up to 5 users', '1GB storage', 'Basic support'] }, { name: 'Pro', price: '', features: ['Unlimited users', '100GB storage', 'Priority support', 'Advanced analytics'], popular: true }, { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'Unlimited storage', '24/7 support', 'Custom integrations'] }].map((plan) => (
              <div key={plan.name} className={'rounded-2xl p-8 border ' + (plan.popular ? 'border-purple-600 bg-purple-50' : 'border-gray-200')}>
                {plan.popular && <span className="inline-block px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-full mb-4">Most Popular</span>}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6"><span className="text-4xl font-bold text-gray-900">{plan.price}</span>{plan.price !== 'Custom' && <span className="text-gray-500">/month</span>}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />{f}</li>
                  ))}
                </ul>
                <button className={'w-full py-2.5 rounded-lg font-medium transition-colors ' + (plan.popular ? 'bg-purple-600 text-white hover:bg-purple-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-50')}>Get Started</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-lg">V</span></div>
              <span className="text-xl font-semibold text-white">Vuexy Chat</span>
            </div>
            <p className="text-sm">© 2026 Vuexy Chat. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
