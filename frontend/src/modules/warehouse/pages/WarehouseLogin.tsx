import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWarehouse } from '../../../services/api/auth/warehouseAuthService';
import { useAuth } from '../../../context/AuthContext';

export default function WarehouseLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const response = await loginWarehouse(email, password);
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
        // Navigate to Warehouse dashboard on success
        navigate('/warehouse', { replace: true });
      } else {
        // Show error and stay on page
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      // Show error and stay on page
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
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
                src="/assets/Inor fresh.png"
                alt="Inor Fresh"
                className="relative z-10 h-24 w-auto object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.25)]"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Warehouse Login</h1>
          <p className="text-cyan-100 text-sm">Access your Warehouse dashboard</p>
        </div>

        {/* Login Form */}
        <div className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!email || !password || loading}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-all shadow-md mt-4 ${email && password && !loading
                ? 'bg-gradient-to-r from-[#003366] to-[#009999] text-white hover:shadow-lg transform hover:-translate-y-0.5'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Registration policy note */}
          <div className="text-center pt-6 mt-4 border-t border-neutral-200">
            <p className="text-sm text-neutral-600">
              Warehouse accounts are created by admin only. Contact admin for onboarding.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <p className="mt-6 text-xs text-neutral-500 text-center max-w-md">
        By continuing, you agree to Inor Fresh's Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
