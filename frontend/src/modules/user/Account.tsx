import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getProfile, updateProfile, CustomerProfile } from '../../services/api/customerService';
import { uploadImage } from '../../services/api/uploadService';
import LocationPermissionRequest from '../../components/LocationPermissionRequest';
import CameraCapture from '../../components/CameraCapture';
import { registerFCMToken } from '../../services/pushNotificationService';

export default function Account() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { user, logout: authLogout, updateUser } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageCamera, setShowImageCamera] = useState(false);
  const [error, setError] = useState('');
  const [showGstModal, setShowGstModal] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [gstError, setGstError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProfileError, setEditProfileError] = useState('');
  const [editProfileSaving, setEditProfileSaving] = useState(false);
  const [refCopied, setRefCopied] = useState(false);
  const [testingFcm, setTestingFcm] = useState(false);
  const [fcmResult, setFcmResult] = useState<'sent' | 'no-token' | 'error' | 'permission-denied' | null>(null);

  const handleTestFcm = async () => {
    if (testingFcm) return;
    setTestingFcm(true);
    setFcmResult(null);
    try {
      // Step 1: Ensure notification permission is granted
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setFcmResult('error');
        return;
      }
      if (Notification.permission === 'denied') {
        setFcmResult('permission-denied');
        return;
      }
      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          setFcmResult('permission-denied');
          return;
        }
      }

      // Step 2: Register / refresh FCM token
      await registerFCMToken(true).catch(() => null);

      // Step 3: Show notification directly via service worker — this is the
      // most reliable path on all browsers regardless of foreground/background state.
      // Race against a 10-second timeout so the button never hangs permanently
      // if the service worker fails to activate.
      const swTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('SW not ready')), 10_000)
      );
      const reg = await Promise.race([navigator.serviceWorker.ready, swTimeout]);
      await reg.showNotification('🔔 Notification Test', {
        body: 'Push notifications are working on this device!',
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: 'fcm-test',
        requireInteraction: false,
        data: { link: '/account' },
      });

      setFcmResult('sent');
    } catch {
      setFcmResult('error');
    } finally {
      setTestingFcm(false);
      setTimeout(() => setFcmResult(null), 5000);
    }
  };

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

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: any) => {
    // Mark as read when clicked
    markAsRead(notification._id);
    setShowNotifications(false);
    // Always navigate to the detail page
    navigate(`/notifications/${notification._id}`, { state: { notification } });
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const processProfileImageFile = async (file: File) => {
    try {
      setIsUploading(true);
      setError('');

      // 1. Upload to Cloudinary
      const uploadResult = await uploadImage(file, 'dhakadsnazzy/users');

      // 2. Update profile with new image URL
      const updateResponse = await updateProfile({ profileImage: uploadResult.secureUrl });

      if (updateResponse.success) {
        setProfile(updateResponse.data);
        // Also update AuthContext user if necessary
        if (user) {
          updateUser({ ...user, profileImage: uploadResult.secureUrl });
        }
      }
    } catch (err: any) {
      console.error('Failed to update profile picture:', err);
      setError('Failed to update profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processProfileImageFile(file);
  };

  const handleImageCameraCapture = (file: File) => {
    void processProfileImageFile(file);
  };

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
    setGstError('');
    const gstnRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstnRegex.test(gstNumber.trim().toUpperCase())) {
      setGstError('Please enter a valid 15-character GSTIN (e.g., 29ABCDE1234F1Z5).');
      return;
    }
    setShowGstModal(false);
  };

  const handleEditProfileOpen = () => {
    setEditName(profile?.name || user?.name || '');
    setEditPhone(profile?.phone || user?.phone || '');
    setEditProfileError('');
    setShowEditProfileModal(true);
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditProfileError('');
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditProfileError('Name cannot be blank.');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
      setEditProfileError('Name should only contain letters and spaces.');
      return;
    }
    setEditProfileSaving(true);
    try {
      const updateResponse = await updateProfile({ name: trimmedName });
      if (updateResponse.success) {
        setProfile(updateResponse.data);
        if (user) updateUser({ ...user, name: trimmedName });
        setShowEditProfileModal(false);
      }
    } catch (err: any) {
      setEditProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setEditProfileSaving(false);
    }
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
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        className="hidden"
        accept="image/*"
      />

      {/* Header Section */}
      <div className="bg-gradient-to-b from-teal-600 to-teal-700 pb-20 pt-10 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
        <div className="px-6 relative z-10">
          <div className="mb-6 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all backdrop-blur-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18L9 12L15 6" /></svg>
            </button>

            {/* FCM Test Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleTestFcm}
                disabled={testingFcm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition-all backdrop-blur-md disabled:opacity-60"
              >
                {testingFcm ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
                )}
                Test FCM
              </button>
              {fcmResult && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  fcmResult === 'sent' ? 'bg-emerald-400/80 text-white' :
                  fcmResult === 'no-token' ? 'bg-amber-400/80 text-white' :
                  fcmResult === 'permission-denied' ? 'bg-orange-500/90 text-white' :
                  'bg-rose-400/80 text-white'
                }`}>
                  {fcmResult === 'sent' ? '✓ Check notification bar!' :
                   fcmResult === 'no-token' ? '⚠ Token failed' :
                   fcmResult === 'permission-denied' ? '✗ Allow notifications in browser' :
                   '✗ Failed'}
                </span>
              )}
            </div>

            <div className="relative z-50" ref={notificationsRef}>
              <button
                onClick={() => navigate('/notifications')}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all backdrop-blur-md relative"
                aria-label="Notifications"
              >
                <span className="material-icons-outlined text-[18px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white p-1 shadow-2xl relative"
              >
                <div 
                  onClick={handleImageClick}
                  className="w-full h-full rounded-full bg-teal-50 flex items-center justify-center overflow-hidden border-2 border-teal-100 cursor-pointer group"
                >
                  {isUploading ? (
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  ) : (profile?.profileImage || user?.profileImage) ? (
                    <img 
                      src={profile?.profileImage || user?.profileImage} 
                      alt={displayName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                </div>

                {/* Gallery Button */}
                <button
                  onClick={handleImageClick}
                  title="Choose from Gallery"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-teal-600 hover:text-teal-700 transition-colors border border-gray-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
                {/* Camera Button */}
                <button
                  onClick={() => setShowImageCamera(true)}
                  title="Take Photo"
                  className="absolute -bottom-1 right-8 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-teal-600 hover:text-teal-700 transition-colors border border-gray-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.25 8.25a2.25 2.25 0 012.25-2.25h1.046c.625 0 1.198-.353 1.477-.911.323-.646.997-1.09 1.777-1.09h2.4c.78 0 1.454.444 1.777 1.09a1.65 1.65 0 001.477.911h1.046a2.25 2.25 0 012.25 2.25v8.25a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V8.25z" />
                    <path d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </button>
              </motion.div>
              <div className="absolute top-0 right-3 w-7 h-7 rounded-full bg-green-500 border-4 border-teal-700 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-sm">{displayName}</h1>
            <div className="flex items-center gap-3 text-teal-50 text-sm font-medium bg-black/10 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              <span>{displayPhone}</span>
            </div>
            <button
              onClick={handleEditProfileOpen}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-teal-100 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-10 mb-6 relative z-20">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Wallet Card */}
          <div className="bg-white rounded-2xl px-4 py-3 shadow-lg shadow-teal-900/5 border border-gray-50 relative overflow-hidden group">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100 flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.5">
                    <path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <path d="M1 10h22" />
                  </svg>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-0.5">Inor Wallet</p>
                  <p className="text-xl font-black text-gray-900 tracking-tight leading-none">
                    ₹{(profile?.walletAmount || user?.walletAmount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold text-xs tracking-wide shadow-md shadow-teal-600/20 whitespace-nowrap"
              >
                Use Balance
              </motion.button>
            </div>
          </div>

          {/* Refer & Earn Section */}
          <div className="bg-white rounded-2xl px-4 py-3 shadow-lg shadow-teal-900/5 border border-gray-50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-orange-600 font-bold uppercase tracking-wider leading-none mb-0.5">Refer &amp; Earn ₹250</p>
                  <p className="text-xs font-semibold text-gray-500 truncate">Share your code with friends</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-dashed border-gray-200 flex-shrink-0">
                <span className="font-bold text-gray-900 tracking-widest text-sm">
                  {profile?.refCode || user?.refCode || 'WAITING...'}
                </span>
                <button
                  onClick={() => {
                    const code = profile?.refCode || user?.refCode || '';
                    if (code) {
                      navigator.clipboard.writeText(code);
                      setRefCopied(true);
                      setTimeout(() => setRefCopied(false), 2000);
                    }
                  }}
                  className="p-1.5 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-colors shadow-sm border border-gray-100"
                  title={refCopied ? 'Copied!' : 'Copy code'}
                >
                  {refCopied ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
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
                { name: 'Change Location', icon: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>, action: () => setShowLocationModal(true) },
                { name: 'GST Details', icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />, action: () => setShowGstModal(true) },
                { name: 'About Inor Fresh', icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>, path: '/about-us' },
                { name: 'Log Out', icon: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />, action: handleLogout, danger: true }
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={item.action ? item.action : () => navigate(item.path!)}
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

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <AnimatePresence>
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setShowEditProfileModal(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-white rounded-t-[40px] w-full max-w-xl p-8 pt-12 pb-28 md:pb-8 relative z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]"
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-100 rounded-full" />
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-6">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Edit Profile</h3>
                <p className="text-sm text-gray-500 mb-6 font-medium">Update your name and contact information.</p>
                <form onSubmit={handleEditProfileSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                      placeholder="Your full name"
                      pattern="[a-zA-Z\s]+"
                      title="Name should only contain letters and spaces"
                      required
                      className="w-full bg-gray-50 rounded-2xl border border-gray-100 px-5 py-4 text-gray-900 text-sm font-semibold placeholder:text-gray-300 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={editPhone}
                      placeholder="10-digit mobile number"
                      readOnly
                      title="Phone number is managed from your account record."
                      className="w-full bg-gray-100 rounded-2xl border border-gray-100 px-5 py-4 text-gray-500 text-sm font-semibold placeholder:text-gray-300 cursor-not-allowed focus:outline-none transition-all"
                    />
                    <p className="mt-1 text-[11px] text-gray-400">Phone number is read-only here.</p>
                  </div>
                  {editProfileError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{editProfileError}</p>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEditProfileModal(false)}
                      className="flex-1 py-4 rounded-2xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={editProfileSaving}
                      className="flex-1 rounded-2xl bg-teal-600 text-white font-bold py-4 text-sm shadow-lg shadow-teal-600/20 disabled:opacity-50 transition-all"
                    >
                      {editProfileSaving ? 'Saving...' : 'Save Changes'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

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
              className="bg-white rounded-t-[40px] w-full max-w-xl p-8 pt-12 pb-28 md:pb-8 relative z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]"
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
                    onChange={(e) => { setGstNumber(e.target.value.toUpperCase()); setGstError(''); }}
                    placeholder="ENTER GSTIN (e.g. 29ABCDE1234F1Z5)"
                    maxLength={15}
                    className="w-full bg-gray-50 rounded-2xl border border-gray-100 px-6 py-4 text-gray-900 text-sm font-bold tracking-widest placeholder:text-gray-300 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all uppercase"
                  />
                  {gstError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-left">{gstError}</p>
                  )}
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

      {/* Full Page Notifications Modal */}
      {showNotifications && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-white overflow-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 z-40 bg-gradient-to-b from-teal-600 to-teal-700 pb-6 pt-6 px-4 md:px-6 shadow-lg">
              <div className="max-w-2xl mx-auto flex items-center justify-between">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all min-h-[44px] min-w-[44px]"
                  aria-label="Close notifications"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18L9 12L15 6" />
                  </svg>
                </button>

                <div className="text-center flex-1">
                  <h1 className="text-2xl font-bold text-white">Notifications</h1>
                  <p className="text-teal-100 text-sm mt-1">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p>
                </div>

                {unreadCount > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-white/20 text-white rounded-full text-xs font-bold hover:bg-white/30 transition-all min-h-[44px]"
                  >
                    Mark All Read
                  </motion.button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto h-[calc(100vh-100px)] pb-24 md:pb-8">
              <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </div>
                    <p className="text-gray-400 font-medium">No notifications yet</p>
                    <p className="text-gray-300 text-sm mt-1">Your notifications will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification: any) => (
                      <motion.div
                        key={notification._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        className={`group cursor-pointer rounded-2xl border-2 transition-all overflow-hidden ${
                          !notification.isRead
                            ? 'bg-teal-50 border-teal-200 hover:border-teal-400 hover:shadow-md'
                            : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full text-left p-4 flex gap-4"
                        >
                          {/* Icon */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg transition-transform group-hover:scale-110 ${
                            notification.type === 'Success'
                              ? 'bg-emerald-100 text-emerald-600'
                              : notification.type === 'Error'
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-teal-100 text-teal-600'
                          }`}>
                            <span>
                              {notification.type === 'Order' || notification.type === 'Payment Confirmed' ? '🛒' : '🔔'}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className={`text-sm font-bold leading-snug ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                                </p>
                                <p className="text-gray-600 text-sm mt-1.5 leading-relaxed line-clamp-2">
                                  {notification.message}
                                </p>
                                {notification.timestamp && (
                                  <p className="text-gray-400 text-xs mt-2.5">
                                    {new Date(notification.timestamp).toLocaleDateString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                )}
                              </div>

                              {/* Unread Indicator */}
                              {!notification.isRead && (
                                <div className="w-3 h-3 rounded-full bg-teal-500 flex-shrink-0 mt-1.5 animate-pulse" />
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Action Bar - always visible (was hover-only, which
                            made the buttons invisible/untappable on touch). */}
                        <div className="px-4 pb-3 pt-2 flex items-center gap-2 border-t border-gray-200/50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            className="flex-1 px-3 py-2 text-xs font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                            title={notification.isRead ? 'Mark as unread' : 'Mark as read'}
                          >
                            {!notification.isRead ? '✓ Mark Read' : '◦ Mark Unread'}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                              setShowNotifications(false);
                              navigate(`/notifications/${notification._id}`, { state: { notification } });
                            }}
                            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                            title="View full notification"
                          >
                            View →
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[200] bg-white overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 z-40 bg-gradient-to-b from-teal-600 to-teal-700 pb-6 pt-6 px-4 md:px-6 shadow-lg">
              <div className="max-w-2xl mx-auto flex items-center gap-4">
                <button
                  onClick={() => {
                    setSelectedNotification(null);
                    setShowNotifications(true);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all min-h-[44px] min-w-[44px]"
                  aria-label="Back"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18L9 12L15 6" />
                  </svg>
                </button>
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-bold text-white">Notification Details</h1>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-50">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                      selectedNotification.type === 'Success'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : selectedNotification.type === 'Error'
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : 'bg-teal-50 text-teal-600 border border-teal-100'
                    }`}>
                      {selectedNotification.type === 'Order' || selectedNotification.type === 'Payment Confirmed' ? '🛒' :
                       selectedNotification.type === 'Delivery' ? '🚚' :
                       selectedNotification.type === 'Payment' ? '💳' : '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-gray-900 mb-1 leading-tight">{selectedNotification.title}</h2>
                      {selectedNotification.timestamp && (
                        <p className="text-sm font-medium text-gray-500">
                          {new Date(selectedNotification.timestamp).toLocaleDateString('en-IN', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Full Message */}
                  <div className="bg-gradient-to-br from-teal-50/50 to-blue-50/50 rounded-2xl p-5 border border-teal-100/50">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words text-[15px]">
                      {selectedNotification.message}
                    </p>

                    {/* Extract and Highlight Order ID if present */}
                    {selectedNotification.message?.match(/#ORD[\dA-Z]+/i) && (
                      <div className="mt-5 pt-5 border-t border-teal-100">
                        <p className="text-xs text-teal-600 font-bold uppercase tracking-wider mb-2">Order Reference</p>
                        <div className="bg-white rounded-xl p-3.5 font-mono text-sm font-bold text-gray-900 break-all border border-teal-100/50 shadow-sm">
                          {selectedNotification.message.match(/#ORD[\dA-Z]+/i)?.[0]}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notification Details Table */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Meta Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                      <span className="text-gray-500 font-medium">Type</span>
                      <span className="font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">{selectedNotification.type || 'Notification'}</span>
                    </div>
                    {selectedNotification.priority && (
                      <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                        <span className="text-gray-500 font-medium">Priority</span>
                        <span className={`font-bold px-3 py-1 rounded-lg text-xs tracking-wide uppercase ${
                          selectedNotification.priority === 'High' ? 'bg-red-50 text-red-600' :
                          selectedNotification.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {selectedNotification.priority}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                      <span className="text-gray-500 font-medium">Status</span>
                      <span className={`font-bold px-3 py-1 rounded-lg text-xs tracking-wide uppercase ${
                        selectedNotification.isRead
                          ? 'bg-gray-50 text-gray-600'
                          : 'bg-teal-50 text-teal-600'
                      }`}>
                        {selectedNotification.isRead ? 'Read' : 'Unread'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Location Modal */}
      {showLocationModal && (
        <LocationPermissionRequest
          onLocationGranted={() => setShowLocationModal(false)}
          skipable={true}
          title="Change Location"
          description="Search and update your delivery location."
          forceOpen={true}
        />
      )}

      {showImageCamera && (
        <CameraCapture
          onCapture={handleImageCameraCapture}
          onClose={() => setShowImageCamera(false)}
        />
      )}
    </div>
  );
}
