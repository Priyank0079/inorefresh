import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getProfile, CustomerProfile } from '../../services/api/customerService';

export default function Account() {
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGstModal, setShowGstModal] = useState(false);
  const [gstNumber, setGstNumber] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getProfile();
        if (response.success) {
          setProfile(response.data);
        } else {
          setError('Failed to load profile');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load profile');
        if (err.response?.status === 401) {
          authLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user, navigate, authLogout]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  const handleGstSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowGstModal(false);
  };

  // Show login/signup prompt for unregistered users
  if (!user) {
    return (
      <div className="pb-24 md:pb-8 min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-gradient-to-b from-[#CDEFF7] to-[#1FA9C6]">
        {/* Decorative Background Fish Icons */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[5%] animate-pulse"><svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#0B3C5D" strokeWidth="0.5"><path d="M2 12c.5-2.5 2.5-4 5-4 4 0 7 4 12 4 1.5 0 3-1 3-3v10c0-2-1.5-3-3-3-5 0-8 4-12 4-2.5 0-4.5-1.5-5-4z" /></svg></div>
          <div className="absolute bottom-[20%] right-[10%] rotate-12 animate-pulse"><svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="#0B3C5D" strokeWidth="0.5"><path d="M2 12c.5-2.5 2.5-4 5-4 4 0 7 4 12 4 1.5 0 3-1 3-3v10c0-2-1.5-3-3-3-5 0-8 4-12 4-2.5 0-4.5-1.5-5-4z" /></svg></div>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl rounded-[40px] p-10 max-w-md w-full text-center relative z-10 shadow-[0_25px_60px_rgba(7,47,74,0.15)] border border-white">
          <div className="w-24 h-24 rounded-3xl bg-[#0B3C5D] flex items-center justify-center mx-auto mb-8 shadow-xl">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="text-[34px] font-black text-[#072F4A] mb-4 uppercase tracking-tighter leading-none italic">Welcome Mate!</h1>
          <p className="text-[#0B3C5D]/70 mb-10 font-semibold text-lg leading-relaxed">
            Dive into your personal dashboard to track orders and manage your fresh catch.
          </p>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login')}
            className="w-full py-5 rounded-2xl font-black text-white bg-gradient-to-r from-[#1CA7C7] to-[#0B3C5D] shadow-2xl transition-all uppercase tracking-widest text-sm"
          >
            Dive In (Login)
          </motion.button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pb-24 md:pb-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1CA7C7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#BEEFFF] font-black uppercase tracking-widest">Scanning Depth...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="pb-24 md:pb-8 min-h-screen flex items-center justify-center p-6">
        <div className="water-card rounded-[32px] p-10 max-w-md w-full text-center relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Deep Sea Mystery</h2>
          <p className="text-red-400 mb-8 font-bold opacity-90">{error}</p>

          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate('/')}
              className="w-full py-4 bg-gradient-to-r from-[#1CA7C7] to-[#0B3C5D] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg"
            >
              Back to Shore
            </motion.button>
            <button
              onClick={handleLogout}
              className="w-full py-4 text-[#BEEFFF] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
            >
              Reset Session (Logout)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile?.name || user?.name || 'Explorer';
  const displayPhone = profile?.phone || user?.phone || '';
  const displayDateOfBirth = profile?.dateOfBirth;

  return (
    <div className="pb-24 md:pb-8 min-h-screen">
      <div className="bg-[#02111A] pb-12 md:pb-16 pt-12 md:pt-16 rounded-b-[40px] shadow-[0_15px_40px_rgba(0,0,0,0.4)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(28,167,199,0.15),_transparent_75%)] pointer-events-none" />
        <div className="px-5 md:px-8 relative z-10">
          <button onClick={() => navigate(-1)} className="mb-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18L9 12L15 6" /></svg>
          </button>

          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 md:w-28 md:h-28 rounded-[28px] bg-gradient-to-br from-[#1CA7C7] to-[#0B3C5D] flex items-center justify-center mb-5 border border-white/20 shadow-[0_0_40px_rgba(28,167,199,0.4)] relative"
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#1CA7C7] border-4 border-[#0B3C5D] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 uppercase tracking-tight drop-shadow-md">{displayName}</h1>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#BEEFFF] font-bold opacity-100">
              {displayPhone && (
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  <span>{displayPhone}</span>
                </div>
              )}
              {displayDateOfBirth && (
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                  <span>{formatDate(displayDateOfBirth)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="px-5 md:px-8 -mt-8 mb-8 relative z-20">
        <div className="max-w-2xl mx-auto">
          <div className="water-card water-shimmer-border rounded-[28px] p-6 md:p-8 relative overflow-hidden group">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#1CA7C7]/20 to-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1CA7C7" strokeWidth="2.5">
                    <path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <path d="M1 10h22" />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] md:text-xs text-[#BEEFFF] font-black uppercase tracking-widest mb-1 opacity-70">Ocean Wallet</p>
                  <p className="text-2xl md:text-4xl font-black text-white">
                    ₹{(profile?.walletAmount || user?.walletAmount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/checkout')}
                className="px-6 py-3 bg-[#1CA7C7] text-white rounded-xl font-black text-xs md:text-sm uppercase tracking-widest shadow-[0_5px_15px_rgba(28,167,199,0.3)]"
              >
                Use Balance
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 md:px-8 mb-8">
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          {[
            { name: 'My Orders', icon: <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />, path: '/orders' },
            { name: 'Help Center', icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />, path: '/faq' }
          ].map((action) => (
            <motion.button
              key={action.name}
              whileHover={{ y: -4 }}
              onClick={() => navigate(action.path)}
              className="water-card rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center text-center group"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1CA7C7" strokeWidth="2.5" className="mb-3 transition-transform group-hover:scale-110">
                {action.icon}
              </svg>
              <span className="text-xs font-black text-white uppercase tracking-widest">{action.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Settings List */}
      <div className="px-5 mb-10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[11px] font-black text-[#1CA7C7] mb-4 uppercase tracking-[0.2em] pl-2 drop-shadow-sm">System Profile</h2>
          <div className="water-card rounded-[32px] overflow-hidden divide-y divide-white/5 shadow-2xl">
            {[
              { name: 'Address Book', icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />, path: '/address-book' },
              { name: 'Your Wishlist', icon: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />, path: '/wishlist' },
              { name: 'GST Details', icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />, action: () => setShowGstModal(true) },
              { name: 'About Store', icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>, action: () => window.open('https://about.dhakadsnazzy.com', '_blank') },
              { name: 'Log Out', icon: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />, action: handleLogout, danger: true }
            ].map((item) => (
              <button
                key={item.name}
                onClick={item.action || (() => navigate(item.path!))}
                className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={item.danger ? '#FF6B6B' : '#0F4A70'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all">
                    {item.icon}
                  </svg>
                  <span className={`text-[13px] font-bold tracking-wide ${item.danger ? 'text-red-600' : 'text-[#072F4A]'}`}>{item.name}</span>
                </div>
                <span className="text-[#1CA7C7] opacity-40 group-hover:opacity-100 transition-opacity">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {showGstModal && (
        <AnimatePresence>
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#072F4A]/80 backdrop-blur-md"
              onClick={() => setShowGstModal(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="water-card rounded-t-[40px] border-t border-white/20 w-full max-w-xl p-8 pt-12 relative z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full" />
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-[#1CA7C7]/20 flex items-center justify-center mx-auto mb-6 border border-[#1CA7C7]/30">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1CA7C7" strokeWidth="2"><rect x="5" y="3" width="14" height="18" rx="2" ry="2" /><line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="13" y2="15" /></svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">GST Registration</h3>
                <p className="text-[14px] text-[#BEEFFF] opacity-70 mb-8 px-6 font-medium">Add your business tax identification for valid GST invoices on every fresh catch.</p>
                <form onSubmit={handleGstSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="ENTER GSTIN"
                    className="w-full bg-white/5 rounded-2xl border border-white/10 px-6 py-4 text-white text-sm font-bold tracking-widest placeholder:text-white/20 focus:outline-none focus:border-[#1CA7C7] focus:ring-4 focus:ring-[#1CA7C7]/10 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!gstNumber.trim()}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#1CA7C7] to-[#0B3C5D] text-white font-black py-5 uppercase tracking-[0.2em] shadow-2xl disabled:opacity-40"
                  >
                    Save Registration
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
