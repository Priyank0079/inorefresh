import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP, verifyOTP } from '../../../services/api/auth/warehouseAuthService';
import OTPInput from '../../../components/OTPInput';
import { useAuth } from '../../../context/AuthContext';

export default function WarehouseLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMobileLogin = async () => {
    if (mobileNumber.length !== 10) return;

    setLoading(true);
    setError('');

    try {
      const response = await sendOTP(mobileNumber);
      if (response.success) {
        // Only show OTP screen on success
        setShowOTP(true);
        setError(''); // Clear any previous errors
      } else {
        // If not successful, show error and stay on page
        setError(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      // On error, show error message and stay on the same page
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
        // Update auth context with Warehouse data
        login(response.data.token, {
          id: response.data.user.id,
          name: response.data.user.warehouseName,
          email: response.data.user.email,
          phone: response.data.user.mobile,
          userType: 'Warehouse',
          storeName: response.data.user.storeName,
          status: response.data.user.status,
          address: response.data.user.address,
          city: response.data.user.city,
        });
        // Navigate to Warehouse dashboard only on success
        navigate('/warehouse', { replace: true });
      } else {
        // If response is not successful, show error and stay on page
        setError(response.message || 'Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      // On error, show error message and stay on the same page
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  const handleInorFreshLogin = () => {
    // Handle Inor fresh login logic here
    navigate('/Warehouse');
  };

  const handleAdminLogin = () => {
    // Navigate to admin login page
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6f2ff] via-[#f0fbff] to-[#e8f7f5] flex flex-col items-center justify-center px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/90 border border-[#cfe4f5] shadow-md flex items-center justify-center hover:bg-white transition-colors"
        aria-label="Back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-[#d8e8f5]">
        {/* Header Section */}
        <div className="px-6 py-6 text-center bg-gradient-to-br from-[#003366] via-[#005a8d] to-[#009999]">
          <div className="flex justify-center mb-4">
            <div className="relative h-28 w-44 flex items-center justify-center">
              <div className="absolute inset-3 rounded-2xl bg-white/20 blur-xl animate-pulse" />
              <div className="absolute inset-5 rounded-xl bg-white/35 shadow-[0_0_30px_rgba(255,255,255,0.45)]" />
              <div className="absolute -inset-x-2 inset-y-10 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-pulse" />
              <img
                src="/images/inor_logo_trans.png"
                alt="Inor fresh"
                className="relative z-10 h-24 w-auto object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.25)]"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Warehouse Login</h1>
          <p className="text-cyan-100 text-sm">Access your Warehouse dashboard</p>
        </div>

        {/* Login Form */}
        <div className="p-6 space-y-4">
          {!showOTP ? (
            /* Mobile Login Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Mobile Number
                </label>
                <div className="flex items-center bg-white border border-neutral-300 rounded-lg overflow-hidden focus-within:border-[#009999] focus-within:ring-2 focus-within:ring-cyan-100 transition-all">
                  <div className="px-3 py-2.5 text-sm font-medium text-neutral-600 border-r border-neutral-300 bg-neutral-50">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter mobile number"
                    className="flex-1 px-3 py-2.5 text-sm placeholder:text-neutral-400 focus:outline-none"
                    maxLength={10}
                    disabled={loading}
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
                className={`w-full py-3 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${mobileNumber.length === 10 && !loading
                  ? 'bg-gradient-to-r from-[#003366] to-[#009999] text-white hover:from-[#003f7a] hover:to-[#00a8a8]'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  }`}
              >
                {loading ? 'Sending...' : 'Continue'}
              </button>
            </div>
          ) : (
            /* OTP Verification Form */
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-neutral-600 mb-2">
                  Enter the 4-digit OTP sent to
                </p>
                <p className="text-sm font-semibold text-neutral-800">+91 {mobileNumber}</p>
              </div>

              <OTPInput onComplete={handleOTPComplete} disabled={loading} />

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded text-center">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowOTP(false);
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors border border-neutral-300"
                >
                  Change Number
                </button>
                <button
                  onClick={async () => {
                    setLoading(true);
                    setError('');
                    try {
                      const response = await sendOTP(mobileNumber);
                      if (response.success) {
                        // OTP resent successfully, clear any previous errors
                        setError('');
                      } else {
                        // Show error but stay on page
                        setError(response.message || 'Failed to resend OTP. Please try again.');
                      }
                    } catch (err: any) {
                      // Show error but stay on page
                      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg font-bold text-sm bg-gradient-to-r from-[#003366] to-[#009999] text-white hover:from-[#003f7a] hover:to-[#00a8a8] transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  {loading ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}





          {/* Registration policy note */}
          <div className="text-center pt-4 border-t border-neutral-200">
            <p className="text-sm text-neutral-600">
              Warehouse accounts are created by admin only. Contact admin for onboarding.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <p className="mt-6 text-xs text-neutral-500 text-center max-w-md">
        By continuing, you agree to Inor fresh's Terms of Service and Privacy Policy
      </p>
    </div>
  );
}


