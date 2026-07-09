import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2, Camera, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register, isLoading } = useAuth();

  const passwordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar must be less than 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setError('');
    setAvatar(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (passwordStrength() < 2) { setError('Password is too weak'); return; }
    if (!agreeTerms) { setError('Please agree to the terms and conditions'); return; }

    try {
      if (avatar) {
        // Register with avatar using FormData
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('avatar', avatar);

        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        
        localStorage.setItem('token', data.token);
        window.location.href = '/chat';
      } else {
        // Register without avatar using JSON
        await register(name, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ' + (step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500')}>
              {step > s ? <CheckCircle2 size={16} /> : s}
            </div>
            <div className={'flex-1 h-1 rounded-full ' + (step > s ? 'bg-purple-600' : 'bg-gray-200')} />
          </div>
        ))}
      </div>

      {step === 1 ? (
        <>
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative">
              <div className={'w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ' + (avatarPreview ? '' : 'bg-purple-600')}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  name ? name.charAt(0).toUpperCase() : <User size={32} />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2 shadow-lg transition-colors"
              >
                <Camera size={14} />
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={() => { setAvatar(null); setAvatarPreview(''); }}
                  className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">Click camera to upload avatar (optional)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
            </div>
          </div>
          <button type="button" onClick={() => setStep(2)} disabled={!name || !email}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-50">
            Continue<ArrowRight size={18} />
          </button>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full pl-10 pr-12 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={'flex-1 h-1.5 rounded-full transition-colors ' + (i < passwordStrength() ? strengthColors[passwordStrength() - 1] : 'bg-gray-200')} />
                ))}
              </div>
              <p className="text-xs text-gray-500">{password && strengthLabels[passwordStrength() - 1] + ' password'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
            </div>
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="w-4 h-4 mt-0.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
            <span className="text-sm text-gray-600">I agree to the <Link to="/terms" className="text-purple-600 hover:text-purple-700">Terms of Service</Link> and <Link to="/privacy" className="text-purple-600 hover:text-purple-700">Privacy Policy</Link></span>
          </label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all">Back</button>
            <button type="submit" disabled={isLoading} className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-50">
              {isLoading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Create Account<ArrowRight size={18} /></>}
            </button>
          </div>
        </>
      )}
      <p className="text-center text-sm text-gray-600">Already have an account? <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">Sign in</Link></p>
    </form>
  );
}
