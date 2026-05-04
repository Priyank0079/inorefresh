import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import OTPInput from '@/components/OTPInput';
import { sendPortOTP, verifyPortOTP } from '@/services/api/auth/portAuthService';

export default function PortLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('9111966732');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");

  const handleContinue = async (e) => {
    e.preventDefault();
    if (mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await sendPortOTP(mobileNumber);
      if (response.success) {
        setShowOTP(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp) => {
    setLoading(true);
    setError("");

    try {
      const response = await verifyPortOTP(mobileNumber, otp);
      if (response.success && response.data) {
        login(response.data.token, response.data.user);
        navigate('/port/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f9f9] flex flex-col items-center justify-center px-4 py-8 font-sans">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-neutral-50 transition-colors"
        aria-label="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header Section */}
        <div className="px-6 py-10 text-center bg-[#134e4a]">
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-2xl p-3 shadow-sm inline-block">
              <img src="/assets/Inor fresh.png" alt="Inor Fresh" className="h-16 w-auto object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Port Login</h1>
          <p className="text-teal-100 text-sm">Access your port dashboard</p>
        </div>

        {/* Login Form */}
        <div className="p-8 space-y-6">
          {!showOTP ? (
            <form onSubmit={handleContinue} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-3">Mobile Number</label>
                <div className="flex items-center bg-white border border-neutral-200 rounded-xl overflow-hidden focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                  <div className="px-4 py-3.5 text-sm font-bold text-neutral-600 border-r border-neutral-200 bg-neutral-50/50">+91</div>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="Enter mobile number"
                    className="flex-1 px-4 py-3.5 text-base placeholder:text-neutral-400 focus:outline-none"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                  <span className="material-icons-outlined text-base">error_outline</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={mobileNumber.length !== 10 || loading}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all shadow-md transform active:scale-[0.98] ${mobileNumber.length === 10 && !loading
                  ? 'bg-gradient-to-r from-[#134e4a] to-[#0f766e] text-white hover:shadow-lg'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`}
              >
                {loading ? "Sending OTP..." : "Continue"}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-neutral-600 mb-2">Enter the 4-digit OTP sent to</p>
                <p className="text-base font-bold text-neutral-800">+91 {mobileNumber}</p>
              </div>

              <OTPInput length={4} onComplete={handleOTPComplete} onChange={setOtp} disabled={loading} />

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center flex items-center justify-center gap-2">
                  <span className="material-icons-outlined text-base">error_outline</span>
                  {error}
                </div>
              )}

              <button
                onClick={() => handleOTPComplete(otp)}
                disabled={otp.length !== 4 || loading}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all shadow-md transform active:scale-[0.98] ${otp.length === 4 && !loading
                  ? 'bg-gradient-to-r from-[#134e4a] to-[#0f766e] text-white hover:shadow-lg'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`}
              >
                {loading ? "Verifying..." : "Login"}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowOTP(false); setError(""); }}
                  className="flex-1 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-all"
                >
                  Edit Number
                </button>
                <button
                  onClick={() => handleContinue({ preventDefault: () => {} })}
                  className="flex-1 py-3 bg-[#134e4a] text-white rounded-xl font-bold text-sm hover:bg-[#0f766e] transition-all"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <p className="text-sm text-neutral-500">
              New Port Partner? {' '}
              <Link to="/port/signup" className="text-teal-700 hover:text-teal-800 font-bold underline underline-offset-4">Register here</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <p className="mt-8 text-[11px] text-neutral-400 text-center max-w-xs leading-relaxed">
        By continuing, you agree to Inor Fresh's <span className="text-neutral-500 font-medium">Terms of Service</span> and <span className="text-neutral-500 font-medium">Privacy Policy</span>
      </p>
    </div>
  );
}
