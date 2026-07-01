import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ResetPasswordForm() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);
  const { resetPassword, isLoading } = useAuth();

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001/api') + '/auth/validate-reset-token/' + token);
        if (!res.ok) throw new Error('Invalid or expired token');
      } catch { setError('This reset link is invalid or has expired.'); }
      finally { setValidating(false); }
    };
    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    try { await resetPassword(token!, password); setSuccess(true); setTimeout(() => navigate('/login'), 3000); }
    catch (err: any) { setError(err.message || 'Failed to reset password'); }
  };

  if (validating) return <div className="text-center py-8"><span className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin inline-block" /><p className="mt-4 text-sm text-gray-500">Validating...</p></div>;
  if (error && !success) return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto"><XCircle size={32} className="text-red-600" /></div>
      <h3 className="text-lg font-semibold text-gray-900">Link Expired</h3>
      <p className="text-sm text-gray-500">{error}</p>
      <Link to="/forgot-password" className="inline-flex items-center gap-2 py-2.5 px-6 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all">Request New Link</Link>
    </div>
  );
  if (success) return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 size={32} className="text-green-600" /></div>
      <h3 className="text-lg font-semibold text-gray-900">Password Reset!</h3>
      <p className="text-sm text-gray-500">Redirecting to login...</p>
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium">Go to login now<ArrowRight size={16} /></Link>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
        <div className="relative">
          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
            className="w-full pl-10 pr-12 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
        <div className="relative">
          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
        </div>
      </div>
      <button type="submit" disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-50">
        {isLoading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Reset Password<ArrowRight size={18} /></>}
      </button>
    </form>
  );
}
