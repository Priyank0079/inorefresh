import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP, verifyOTP } from '../../../services/api/auth/adminAuthService';
import OTPInput from '../../../components/OTPInput';
import { useAuth } from '../../../context/AuthContext';

type SelectedRole = 'Admin' | 'Investor' | 'Staff' | null;

const ROLES = [
  {
    id: 'Admin' as const,
    label: 'Admin',
    description: 'Full access to all modules, manage team and settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    accentClass: 'border-teal-500 bg-teal-50',
    iconClass: 'text-teal-600 bg-teal-100',
    badgeClass: 'bg-teal-100 text-teal-700',
    badgeText: 'Full Access',
    ringClass: 'ring-teal-300',
  },
  {
    id: 'Investor' as const,
    label: 'Investor',
    description: 'View all data across every module — read-only access',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    accentClass: 'border-violet-500 bg-violet-50',
    iconClass: 'text-violet-600 bg-violet-100',
    badgeClass: 'bg-violet-100 text-violet-700',
    badgeText: 'Read Only',
    ringClass: 'ring-violet-300',
  },
  {
    id: 'Staff' as const,
    label: 'Staff',
    description: 'Access specific modules assigned by the Admin',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    accentClass: 'border-amber-500 bg-amber-50',
    iconClass: 'text-amber-600 bg-amber-100',
    badgeClass: 'bg-amber-100 text-amber-700',
    badgeText: 'Limited Access',
    ringClass: 'ring-amber-300',
  },
] as const;

export default function AdminLogin() {
  const navigate = useNavigate();
  const { logout, login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    logout();
  }, [logout]);

  const handleRoleSelect = (role: SelectedRole) => {
    setSelectedRole(role);
    setError('');
  };

  const handleMobileLogin = async () => {
    if (mobileNumber.length !== 10) return;
    setLoading(true);
    setError('');
    try {
      await sendOTP(mobileNumber);
      setShowOTP(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await verifyOTP(mobileNumber, otp);
      if (response.success && response.data) {
        login(response.data.token, {
          ...response.data.user,
          userType: 'Admin',
        });
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (showOTP) {
      setShowOTP(false);
      setError('');
    } else if (selectedRole) {
      setSelectedRole(null);
      setError('');
    } else {
      navigate(-1);
    }
  };

  const activeRole = ROLES.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex flex-col items-center justify-center px-4 py-8">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-neutral-50 transition-colors"
        aria-label="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 text-center bg-gradient-to-br from-teal-700 to-teal-900">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/Inor fresh.png"
              alt="Inor Fresh"
              className="h-28 w-auto object-contain bg-white/90 rounded-xl p-2 shadow-sm"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {selectedRole ? `${selectedRole} Login` : 'Admin Access'}
          </h1>
          <p className="text-teal-100 text-sm">
            {selectedRole ? activeRole?.description : 'Select your access level to continue'}
          </p>
        </div>

        <div className="p-6">
          {!selectedRole ? (
            /* Step 1 — Role Selection */
            <div className="space-y-3">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                Choose your role
              </p>
              {ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md active:scale-[0.99] hover:ring-2 ${role.accentClass} ${role.ringClass}`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${role.iconClass}`}>
                    {role.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-neutral-800 text-sm">{role.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role.badgeClass}`}>
                        {role.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400 flex-shrink-0">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          ) : !showOTP ? (
            /* Step 2 — Mobile Number */
            <div className="space-y-4">
              {/* Role indicator strip */}
              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border-2 ${activeRole?.accentClass}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${activeRole?.iconClass}`}>
                  <span className="[&>svg]:w-4 [&>svg]:h-4">{activeRole?.icon}</span>
                </div>
                <span className="text-xs font-medium text-neutral-700 flex-1">
                  Signing in as <span className="font-bold">{selectedRole}</span>
                </span>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-xs text-neutral-400 hover:text-neutral-600 underline whitespace-nowrap"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Mobile Number
                </label>
                <div className="flex items-center bg-white border border-neutral-300 rounded-lg overflow-hidden focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-200 transition-all">
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter mobile number"
                    className="flex-1 px-3 py-2.5 text-sm placeholder:text-neutral-400 focus:outline-none"
                    maxLength={10}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <button
                onClick={handleMobileLogin}
                disabled={mobileNumber.length !== 10 || loading}
                className={`w-full py-3 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                  mobileNumber.length === 10 && !loading
                    ? 'bg-gradient-to-r from-teal-700 to-teal-900 text-white hover:from-teal-800 hover:to-teal-950'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          ) : (
            /* Step 3 — OTP */
            <div className="space-y-4">
              {/* Role + number strip */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${activeRole?.accentClass}`}>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${activeRole?.badgeClass}`}>
                  {selectedRole}
                </span>
                <span className="text-xs text-neutral-500">
                  {`+91 ${mobileNumber}`}
                </span>
              </div>

              <div className="text-center">
                <p className="text-sm text-neutral-600 mb-1">Enter the 4-digit OTP sent to</p>
                <p className="text-sm font-semibold text-neutral-800">
                  {`+91 ${mobileNumber}`}
                </p>
              </div>

              <OTPInput onComplete={handleOTPComplete} disabled={loading} />

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded text-center">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowOTP(false); setError(''); }}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors border border-neutral-300">
                  Change Number
                </button>
                <button
                  onClick={handleMobileLogin}
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg font-bold text-sm bg-gradient-to-r from-teal-700 to-teal-900 text-white hover:from-teal-800 hover:to-teal-950 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  {loading ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-neutral-500 text-center max-w-md">
        By continuing, you agree to Inor Fresh's Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
