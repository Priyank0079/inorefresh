import { useNavigate, Link } from 'react-router-dom';
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

  if (!user) {
    return (
      <div className="pb-24 md:pb-8 min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white rounded-[32px] p-10 max-w-md w-full text-center shadow-xl border border-gray-100">
          <div className="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-6 text-teal-600">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Welcome to Inor Fresh</h1>
          <p className="text-gray-500 mb-8 font-medium leading-relaxed">
            Please log in to your account to view your orders, wallet balance, and settings.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login')}
            className="w-full py-4 rounded-xl font-bold text-white bg-teal-600 shadow-lg shadow-teal-600/20 transition-all text-sm uppercase tracking-wider"
          >
            Login / Sign Up
          </motion.button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pb-24 md:pb-8 min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading Profile...</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.name || user?.name || 'User';
  const displayPhone = profile?.phone || user?.phone || '';
  const displayDateOfBirth = profile?.dateOfBirth;

  return (
    <div className="pb-24 md:pb-8 min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-teal-600 to-teal-700 pb-20 pt-10 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
        <div className="px-6 relative z-10">
          <button onClick={() => navigate(-1)} className="mb-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all backdrop-blur-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18L9 12L15 6" /></svg>
          </button>

          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white p-1 shadow-2xl"
              >
                <div className="w-full h-full rounded-full bg-teal-50 flex items-center justify-center overflow-hidden border-2 border-teal-100">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </motion.div>
              <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-green-500 border-4 border-teal-700 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-sm">{displayName}</h1>
            <div className="flex items-center gap-3 text-teal-50 text-sm font-medium bg-black/10 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              <span>{displayPhone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 -mt-12 mb-8 relative z-20">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Wallet Card */}
          <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-xl shadow-teal-900/5 border border-white relative overflow-hidden group">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-teal-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.5">
                    <path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <path d="M1 10h22" />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">Inor Wallet</p>
                  <p className="text-3xl md:text-4xl font-bold text-gray-900">
                    ₹{(profile?.walletAmount || user?.walletAmount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/checkout')}
                className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm tracking-tight shadow-lg shadow-teal-600/20 transition-all"
              >
                Use Balance
              </motion.button>
            </div>
          </div>

          {/* Refer & Earn Section */}
          <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-teal-900/5 border border-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mb-0.5">Refer & Earn ₹250</p>
                  <p className="text-sm font-semibold text-gray-600">Share your code with friends</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-gray-50 p-2 pl-5 rounded-2xl border border-gray-100 border-dashed w-full sm:w-auto">
                <span className="font-bold text-gray-900 tracking-widest text-lg">
                  {profile?.refCode || user?.refCode || 'WAITING...'}
                </span>
                <button
                  onClick={() => {
                    const code = profile?.refCode || user?.refCode || '';
                    if (code) {
                      navigator.clipboard.writeText(code);
                      alert('Referral code copied to clipboard!');
                    }
                  }}
                  className="p-2.5 bg-white text-teal-600 rounded-xl hover:bg-teal-50 transition-colors shadow-sm border border-gray-100"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'My Orders', icon: <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />, path: '/orders', color: 'bg-teal-50 text-teal-600' },
              { name: 'Help Center', icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />, path: '/faq', color: 'bg-blue-50 text-blue-600' }
            ].map((action) => (
              <motion.button
                key={action.name}
                whileHover={{ y: -4 }}
                onClick={() => navigate(action.path)}
                className="bg-white rounded-3xl p-6 shadow-xl shadow-teal-900/5 border border-white flex flex-col items-center justify-center text-center group"
              >
                <div className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    {action.icon}
                  </svg>
                </div>
                <span className="text-sm font-bold text-gray-900">{action.name}</span>
              </motion.button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="space-y-3 pt-4">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-4 mb-3">System & Settings</h2>
            <div className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-teal-900/5 border border-white divide-y divide-gray-50">
              {[
                { name: 'Address Book', icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />, path: '/address-book' },
                { name: 'Your Wishlist', icon: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />, path: '/wishlist' },
                { name: 'GST Details', icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />, action: () => setShowGstModal(true) },
                { name: 'About Inor Fresh', icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>, action: () => window.open('https://about.dhakadsnazzy.com', '_blank') },
                { name: 'Log Out', icon: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />, action: handleLogout, danger: true }
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={item.action || (() => navigate(item.path!))}
                  className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${item.danger ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 group-hover:text-teal-600 group-hover:bg-teal-50'} transition-colors`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        {item.icon}
                      </svg>
                    </div>
                    <span className={`text-sm font-semibold ${item.danger ? 'text-red-500' : 'text-gray-700'}`}>{item.name}</span>
                  </div>
                  <span className="text-gray-300 group-hover:text-teal-500 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </span>
                </button>
              ))}
            </div>
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
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setShowGstModal(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-white rounded-t-[40px] w-full max-w-xl p-8 pt-12 relative z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]"
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-100 rounded-full" />
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-6">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2"><rect x="5" y="3" width="14" height="18" rx="2" ry="2" /><line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="13" y2="15" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">GST Registration</h3>
                <p className="text-sm text-gray-500 mb-8 px-6 font-medium">Add your business tax identification for valid GST invoices on every order.</p>
                <form onSubmit={handleGstSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="ENTER GSTIN"
                    className="w-full bg-gray-50 rounded-2xl border border-gray-100 px-6 py-4 text-gray-900 text-sm font-bold tracking-widest placeholder:text-gray-300 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all uppercase"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!gstNumber.trim()}
                    className="w-full rounded-2xl bg-teal-600 text-white font-bold py-5 uppercase tracking-wider shadow-lg shadow-teal-600/20 disabled:opacity-40"
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
