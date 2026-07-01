import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { forgotPassword, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try { await forgotPassword(email); setSubmitted(true); }
    catch (err: any) { setError(err.message || 'Failed to send reset email'); }
  };

  if (submitted) return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 size={32} className="text-green-600" /></div>
      <h3 className="text-lg font-semibold text-gray-900">Check your email</h3>
      <p className="text-sm text-gray-500">We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.</p>
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"><ArrowLeft size={16} />Back to login</Link>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
      <p className="text-sm text-gray-500">Enter your email address and we'll send you a link to reset your password.</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
        <div className="relative">
          <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
        </div>
      </div>
      <button type="submit" disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-50">
        {isLoading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Send Reset Link<Send size={18} /></>}
      </button>
      <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"><ArrowLeft size={16} />Back to login</Link>
    </form>
  );
}
