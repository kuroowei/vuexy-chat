import { useEffect, useState } from 'react';
import { X, Wallet as WalletIcon, PlayCircle, RefreshCw, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

interface WalletData {
  balance: number;
  totalEarned: number;
}

interface VideoStat {
  id: string;
  content: string;
  videoUrl: string;
  views: number;
  eligible: boolean;
  minEligibleViews: number;
  createdAt: string;
}

interface EarningEntry {
  id: string;
  post: { id: string; content: string; videoUrl: string } | null;
  viewsCounted: number;
  amount: number;
  periodEnd: string;
}

interface MonetizationDashboardModalProps {
  onClose: () => void;
}

const formatNaira = (amount: number) =>
  '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function MonetizationDashboardModal({ onClose }: MonetizationDashboardModalProps) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [videos, setVideos] = useState<VideoStat[]>([]);
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const loadAll = async () => {
    setError('');
    try {
      const [walletRes, videosRes, earningsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/monetization/wallet`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/monetization/videos`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/monetization/earnings`, { headers: authHeaders() }),
      ]);
      const walletData = await walletRes.json();
      const videosData = await videosRes.json();
      const earningsData = await earningsRes.json();
      if (!walletRes.ok) throw new Error(walletData.message || 'Failed to load wallet');
      setWallet(walletData);
      setVideos(videosData.videos || []);
      setEarnings(earningsData.earnings || []);
    } catch (err: any) {
      console.error('Failed to load monetization dashboard:', err);
      setError(err.message || 'Failed to load earnings data');
    }
  };

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, []);

  const handleCalculateNow = async () => {
    setCalculating(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/monetization/calculate-now`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to run calculation');
      await loadAll();
    } catch (err: any) {
      console.error('Failed to run earnings calculation:', err);
      setError(err.message || 'Failed to run calculation');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <WalletIcon size={20} className="text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Earnings</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-purple-600" />
            </div>
          )}

          {!loading && error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}

          {!loading && wallet && (
            <>
              <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-5 text-white">
                <p className="text-xs text-purple-100">Available balance</p>
                <p className="text-3xl font-bold mt-1">{formatNaira(wallet.balance)}</p>
                <p className="text-xs text-purple-100 mt-2">
                  {formatNaira(wallet.totalEarned)} earned lifetime
                </p>
              </div>

              <button
                onClick={handleCalculateNow}
                disabled={calculating}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-60"
              >
                {calculating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Refresh earnings now
              </button>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Your videos</h3>
                {videos.length === 0 && (
                  <p className="text-sm text-gray-400">No videos posted yet.</p>
                )}
                <div className="space-y-2">
                  {videos.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <PlayCircle size={18} className="text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{v.content || 'Untitled video'}</p>
                        <p className="text-xs text-gray-400">
                          {v.views} view{v.views === 1 ? '' : 's'}
                          {v.eligible ? '' : ` · ${v.minEligibleViews - v.views} more to start earning`}
                        </p>
                      </div>
                      {v.eligible && (
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex-shrink-0">
                          Monetized
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Earnings history</h3>
                {earnings.length === 0 && (
                  <p className="text-sm text-gray-400">No earnings recorded yet.</p>
                )}
                <div className="space-y-2">
                  {earnings.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 truncate">
                          {e.post?.content || 'Video'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {e.viewsCounted} view{e.viewsCounted === 1 ? '' : 's'} ·{' '}
                          {new Date(e.periodEnd).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-green-600 flex-shrink-0">
                        +{formatNaira(e.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
