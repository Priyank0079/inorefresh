import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerPort } from '@/services/api/auth/portAuthService';
import { useAuth } from '@/context/AuthContext';

export default function PortSignup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    portName: '',
    managerName: '',
    email: '',
    mobile: '',
    location: '',
    licenseNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
        setError("Name should contain letters and spaces only.");
        setLoading(false);
        return;
      }
      if (!/^[0-9]{10}$/.test(formData.mobile.trim())) {
        setError("Mobile number must be exactly 10 digits.");
        setLoading(false);
        return;
      }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address format (e.g., name@gmail.com).");
        setLoading(false);
        return;
      }

      const response = await registerPort(formData);
      if (response.success && response.data) {
        const { token, user } = response.data;
        // Directly login the user with the token and user data returned from registration
        login(token, user);
        navigate('/port');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#f0f9f9] flex flex-col items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-8 text-center bg-[#134e4a]">
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-2xl p-3 shadow-sm inline-block">
              <img
                src="/assets/Inor fresh.png"
                alt="Inor Fresh"
                className="h-16 w-auto object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Port Registration</h1>
          <p className="text-teal-100 text-sm">Join our supply network</p>
        </div>

        <div className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-neutral-700">Name</label>
              <input
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                placeholder="Enter your name or business name"
                required
                pattern="[a-zA-Z\s]+"
                title="Name should only contain letters and spaces"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value.replace(/[^a-zA-Z\s]/g, '')})}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Bug #2: portName is now a controlled input with value + alphanumeric-only filter */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Port Name</label>
                <input
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                  placeholder="e.g. Veraval Port"
                  required
                  value={formData.portName}
                  pattern="[a-zA-Z0-9\s\-]+"
                  title="Port name should only contain letters, numbers, spaces, and hyphens"
                  onChange={(e) => setFormData({...formData, portName: e.target.value.replace(/[^a-zA-Z0-9\s\-]/g, '')})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Manager Name</label>
                <input
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                  placeholder="Full Name"
                  required
                  pattern="[a-zA-Z\s]+"
                  title="Manager name should only contain letters and spaces"
                  value={formData.managerName}
                  onChange={(e) => setFormData({...formData, managerName: e.target.value.replace(/[^a-zA-Z\s]/g, '')})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Mobile Number</label>
                <input
                  type="tel"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                  placeholder="10-digit number"
                  maxLength={10}
                  required
                  pattern="[0-9]{10}"
                  title="Mobile number must be exactly 10 digits"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Email Address</label>
                <input
                  type="email"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                  placeholder="email@port.com"
                  required
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                  title="Please enter a valid email address"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Bug #3: location filter extended to also block special chars (except , / -) */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Location (City/State)</label>
                <input
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                  placeholder="e.g. Veraval, Gujarat"
                  required
                  pattern="[a-zA-Z\s,\/\-]+"
                  title="Location should only contain letters, spaces, commas, slashes, and hyphens"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value.replace(/[^a-zA-Z\s,\/\-]/g, '')})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Fishing License No.</label>
                <input
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                  placeholder="e.g. PRT-12345"
                  required
                  value={formData.licenseNumber}
                  pattern="[a-zA-Z0-9\-]+"
                  title="License number should contain letters, numbers, and hyphens only"
                  onChange={(e) => setFormData({...formData, licenseNumber: e.target.value.replace(/[^a-zA-Z0-9\-]/g, '').toUpperCase()})}
                />
              </div>
            </div>

            <div className="flex items-start gap-3 mt-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 w-4 h-4 text-teal-600 rounded border-neutral-300 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-sm text-neutral-600">
                I agree to the{' '}
                <Link to="/terms" className="text-teal-700 hover:text-teal-800 font-bold hover:underline" target="_blank">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="text-teal-700 hover:text-teal-800 font-bold hover:underline" target="_blank">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                <span className="material-icons-outlined text-base">error_outline</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#134e4a] text-white rounded-xl font-bold hover:bg-[#0f766e] transition-all mt-4 shadow-lg shadow-teal-900/20"
            >
              {loading ? "Submitting..." : "Submit Registration"}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm text-neutral-500">
              Already have an account? {' '}
              <Link to="/port/login" className="text-teal-700 hover:text-teal-800 font-bold underline underline-offset-4">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
