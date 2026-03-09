import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP, verifyOTP } from '../../services/api/auth/customerAuthService';
import { useAuth } from '../../context/AuthContext';
import OTPInput from '../../components/OTPInput';
import { useThemeContext } from '../../context/ThemeContext';
import api from '../../services/api/config';

type UserType = 'horeca' | 'retailer' | null;
type FlowStep = 'accountType' | 'login' | 'signupHoreca' | 'signupRetailer';
type Language = 'English' | 'Hindi' | 'Tamil' | 'Telugu' | 'Kannada' | 'Malayalam' | 'Bengali' | 'Marathi' | 'Gujarati' | 'Odia';

const deliveryTimes = ['6 AM to 7 AM', '7 AM to 8 AM', '8 AM to 9 AM', '9 AM to 10 AM', '10 AM to 11 AM', 'Any time'];
const paymentModes = ['COD', 'Bill to Bill', '3 Days', 'Weekly', 'Other'];
const productList = [
  'Seer Fish', 'Mackerel', 'Sardine', 'Indian Salmon', 'Silver Fish', 'Katla', 'Rohu',
  'Tilapia', 'Pomfret', 'Shrimps', 'Hilsa', 'Crab', 'Pink Perch', 'Lady Fish',
  'Kari Meen', 'Papada', 'Thenkara', 'Aar Mach', 'Bata', 'Sea Water Prawns'
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mobileNumber, setMobileNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentTheme } = useThemeContext();

  const [flowStep, setFlowStep] = useState<FlowStep>('accountType');
  const [userType, setUserType] = useState<UserType>(null);
  const [language, setLanguage] = useState<Language>('English');
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Form states
  const [formData, setFormData] = useState<any>({
    shopName: '', address: '', googleMapLink: '', deliveryTime: '', paymentMode: '',
    highValueProducts: [], inorRepresentative: '', shopPhone: '', ownerName: '', ownerPhone: ''
  });
  const [files, setFiles] = useState<File[]>([]);

  // Translations
  const translations = {
    English: {
      selectType: 'Select Account Type',
      horeca: 'HORECA',
      horecaDesc: 'For Hotels, Restaurants, Cafes, Caterers',
      retailer: 'Retailer',
      retailerDesc: 'For Fish Shops and Local Sellers',
      welcome: 'Welcome Back',
      enterMobile: 'Enter mobile number',
      continue: 'Continue',
      loginAsHoreca: 'Login as HORECA',
      loginAsRetailer: 'Login as Retailer',
      noAccount: "Don't have an account?",
      signUp: 'Sign Up',
      processing: 'Processing...',
      verification: 'Verification',
      enterCode: 'Enter the code sent to +91 ',
      resend: 'Resend OTP',
      changeNumber: 'Change Number',
      terms: 'By continuing, you agree to our ',
      termsLink: 'Terms of Service',
      and: ' & ',
      privacyLink: 'Privacy Policy',
      fueledBy: 'Powered by Inor Fresh'
    },
    // Adding minimal fallback logic for other languages
  };

  const t = (translations as Record<string, any>)[language] || {
    selectType: 'Select Account Type',
    horeca: 'HORECA',
    horecaDesc: 'For Hotels, Restaurants, Cafes, Caterers',
    retailer: 'Retailer',
    retailerDesc: 'For Fish Shops and Local Sellers',
    welcome: 'Welcome Back',
    enterMobile: 'Enter mobile number',
    continue: 'Continue',
    loginAsHoreca: 'Login as HORECA',
    loginAsRetailer: 'Login as Retailer',
    noAccount: "Don't have an account?",
    signUp: 'Sign Up',
    processing: 'Processing...',
    verification: 'Verification',
    enterCode: 'Enter the code sent to +91 ',
    resend: 'Resend OTP',
    changeNumber: 'Change Number',
    terms: 'By continuing, you agree to our ',
    termsLink: 'Terms of Service',
    and: ' & ',
    privacyLink: 'Privacy Policy',
    fueledBy: 'Powered by Inor Fresh'
  };

  const handleContinue = async () => {
    if (mobileNumber.length !== 10) return;
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { phone: mobileNumber, userType });
      if (response.data.success) {
        // Assume OTP logic or direct login depending on backend iteration
        // For now, mock OTP sent
        setShowOTP(true);
      }
    } catch (err: any) {
      // if customer not found, open signup? 
      // Mock fallback to our customerAuthService just in case
      try {
        const res = await sendOTP(mobileNumber);
        if (res.sessionId) setSessionId(res.sessionId);
        setShowOTP(true);
      } catch (e) {
        setError('User not found or failed to initiate call. Please Sign Up.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await verifyOTP(mobileNumber, otp, sessionId);
      if (response.success && response.data) {
        login(response.data.token, {
          id: response.data.user.id,
          name: response.data.user.name,
          phone: response.data.user.phone,
          email: response.data.user.email,
          walletAmount: response.data.user.walletAmount,
          refCode: response.data.user.refCode,
          status: response.data.user.status,
        });
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Create FormData
      const fd = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'highValueProducts') {
          fd.append(key, JSON.stringify(formData[key]));
        } else {
          fd.append(key, formData[key]);
        }
      });
      files.forEach(file => fd.append('documents', file));

      const endpoint = userType === 'horeca' ? '/auth/signup-horeca' : '/auth/signup-retailer';
      await api.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      // Go back to login on success
      setFlowStep('login');
      alert("Sign up successful! Please log in.");
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoClick = () => navigate('/');

  const toggleProduct = (prod: string) => {
    const current = formData.highValueProducts;
    if (current.includes(prod)) {
      setFormData({ ...formData, highValueProducts: current.filter((p: string) => p !== prod) });
    } else {
      setFormData({ ...formData, highValueProducts: [...current, prod] });
    }
  };

  const renderLanguageSelector = () => (
    <div className="absolute top-4 right-4 z-50">
      <button
        onClick={() => setShowLangMenu(!showLangMenu)}
        className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all text-neutral-600 flex items-center gap-2 text-sm font-semibold"
      >
        <span>🌐</span> {language}
      </button>
      {showLangMenu && (
        <div className="absolute right-0 mt-2 py-2 w-40 bg-white rounded-xl shadow-xl border border-neutral-100 max-h-60 overflow-y-auto">
          {['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Odia'].map(lang => (
            <button
              key={lang}
              onClick={() => { setLanguage(lang as Language); setShowLangMenu(false); }}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 ${language === lang ? 'text-teal-600 font-bold' : 'text-neutral-700'}`}
            >
              {lang}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: `linear-gradient(to bottom right, ${currentTheme.primary[2]}20, ${currentTheme.primary[3]}30)` }}
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ backgroundColor: currentTheme.primary[1] }}></div>
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" style={{ backgroundColor: currentTheme.secondary[1] }}></div>
      <div className="absolute bottom-[-10%] left-[20%] w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" style={{ backgroundColor: currentTheme.primary[2] }}></div>

      {renderLanguageSelector()}

      {/* Back Button */}
      {flowStep !== 'accountType' && (
        <button
          onClick={() => flowStep !== 'login' ? setFlowStep('login') : setFlowStep('accountType')}
          className="absolute top-4 left-4 z-20 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all text-neutral-600 hover:text-neutral-900"
          aria-label="Back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Main Card */}
      <div className={`w-full ${flowStep.includes('signup') ? 'max-w-2xl' : 'max-w-md'} bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 relative z-10 transition-all duration-300 max-h-[90vh] flex flex-col`}>

        {/* Header Section */}
        <div className="w-full bg-gradient-to-b from-white/50 to-transparent p-8 pb-6 flex flex-col items-center flex-shrink-0">
          <button onClick={handleLogoClick} className="hover:opacity-80 transition-opacity mb-8">
            <img src="/assets/Inor fresh.png" alt="Inor Fresh" className="h-28 sm:h-32 w-auto object-contain drop-shadow-md" loading="lazy" />
          </button>

          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-800 text-center mb-2">
            {flowStep === 'accountType' ? t.selectType : showOTP ? t.verification : flowStep.includes('signup') ? `Sign Up as ${userType?.toUpperCase()}` : userType === 'horeca' ? t.loginAsHoreca : t.loginAsRetailer}
          </h2>
        </div>

        {/* Content Section */}
        <div className="px-8 pb-8 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-sm text-red-600 animate-fadeIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
              {error}
            </div>
          )}

          {flowStep === 'accountType' && (
            <div className="space-y-4">
              <button
                onClick={() => { setUserType('horeca'); setFlowStep('login'); }}
                className="w-full p-6 flex flex-col items-center justify-center rounded-2xl border-2 border-neutral-100 hover:border-teal-500 bg-white hover:bg-neutral-50 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="font-extrabold text-xl sm:text-2xl text-neutral-800 group-hover:text-teal-600 transition-colors uppercase tracking-widest">{t.horeca}</div>
                <div className="text-sm font-medium text-neutral-500 mt-2 text-center">{t.horecaDesc}</div>
              </button>

              <button
                onClick={() => { setUserType('retailer'); setFlowStep('login'); }}
                className="w-full p-6 flex flex-col items-center justify-center rounded-2xl border-2 border-neutral-100 hover:border-teal-500 bg-white hover:bg-neutral-50 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="font-extrabold text-xl sm:text-2xl text-neutral-800 group-hover:text-teal-600 transition-colors uppercase tracking-widest">{t.retailer}</div>
                <div className="text-sm font-medium text-neutral-500 mt-2 text-center">{t.retailerDesc}</div>
              </button>
            </div>
          )}

          {flowStep === 'login' && !showOTP && (
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-neutral-400 font-medium text-lg">+91</span>
                </div>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="block w-full pl-14 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-xl text-lg font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none transition-all"
                  style={{
                    boxShadow: `0 0 0 2px ${currentTheme.primary[3]}20`,
                    borderColor: currentTheme.primary[3]
                  }}
                  placeholder={t.enterMobile}
                  maxLength={10}
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleContinue}
                disabled={mobileNumber.length !== 10 || loading}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ${mobileNumber.length === 10 && !loading
                  ? 'text-white'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                style={mobileNumber.length === 10 && !loading ? {
                  background: `linear-gradient(to right, ${currentTheme.primary[1]}, ${currentTheme.primary[3]})`
                } : {}}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t.processing}</span>
                  </div>
                ) : (
                  t.continue
                )}
              </button>

              <div className="mt-6 text-center pt-4 border-t border-neutral-100">
                <p className="text-sm text-neutral-500 mb-2">{t.noAccount}</p>
                <button
                  onClick={() => setFlowStep(userType === 'horeca' ? 'signupHoreca' : 'signupRetailer')}
                  className="font-bold hover:underline transition-colors"
                  style={{ color: currentTheme.primary[3] }}
                >
                  {t.signUp}
                </button>
              </div>
            </div>
          )}

          {flowStep === 'login' && showOTP && (
            <div className="space-y-6">
              <p className="text-neutral-500 text-center text-sm mb-6 leading-relaxed">
                {t.enterCode}{mobileNumber}
              </p>
              <div className="flex justify-center">
                <OTPInput onComplete={handleOTPComplete} disabled={loading} />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowOTP(false); setError(''); }}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800 transition-colors"
                >
                  {t.changeNumber}
                </button>
                <button
                  onClick={handleContinue}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-colors border"
                  style={{
                    backgroundColor: `${currentTheme.primary[3]}10`,
                    color: currentTheme.primary[3],
                    borderColor: `${currentTheme.primary[3]}30`
                  }}
                >
                  {loading ? t.processing : t.resend}
                </button>
              </div>
            </div>
          )}

          {/* Signup Forms */}
          {flowStep.includes('signup') && (
            <form onSubmit={handleSignupSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Shop Name *" className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl" onChange={e => setFormData({ ...formData, shopName: e.target.value })} />
                <input required placeholder="Shop Phone Number *" className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl" onChange={e => setFormData({ ...formData, shopPhone: e.target.value })} />
                <input required placeholder="Shop Owner Name *" className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl" onChange={e => setFormData({ ...formData, ownerName: e.target.value })} />
                <input required placeholder="Owner Phone Number *" className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl" onChange={e => setFormData({ ...formData, ownerPhone: e.target.value })} />
                <input required placeholder="Inor Representative *" className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl" onChange={e => setFormData({ ...formData, inorRepresentative: e.target.value })} />
                <input required placeholder="Google Map Link *" className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl" onChange={e => setFormData({ ...formData, googleMapLink: e.target.value })} />
              </div>

              <textarea required placeholder="Address Of The Shop *" className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl" rows={2} onChange={e => setFormData({ ...formData, address: e.target.value })}></textarea>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select required className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl" onChange={e => setFormData({ ...formData, deliveryTime: e.target.value })}>
                  <option value="">Delivery Time *</option>
                  {deliveryTimes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select required className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl" onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}>
                  <option value="">Mode Of Payment *</option>
                  {paymentModes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2 text-neutral-700">High Value Products *</p>
                <div className="flex flex-wrap gap-2">
                  {productList.map(p => (
                    <button type="button" key={p} onClick={() => toggleProduct(p)} className={`px-3 py-1 text-xs rounded-full border transition-colors ${formData.highValueProducts.includes(p) ? 'bg-teal-600 text-white border-teal-600' : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2 text-neutral-700">Documents & Photos (Max 10) *</p>
                <p className="text-xs text-neutral-500 mb-2">Aadhar Card, PAN Card, FSSAI Certificate, GST, Cancelled Cheque</p>
                <input required type="file" multiple accept="image/*,.pdf" onChange={e => setFiles(Array.from(e.target.files || []).slice(0, 10))} className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                {files.length > 0 && <p className="text-xs text-teal-600 mt-2">{files.length} file(s) selected.</p>}
              </div>

              <button
                type="submit"
                disabled={loading || files.length === 0}
                className="w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl text-white mt-6 transition-all"
                style={{ background: `linear-gradient(to right, ${currentTheme.primary[1]}, ${currentTheme.primary[3]})` }}
              >
                {loading ? t.processing : 'Submit Registration'}
              </button>
            </form>
          )}

          {/* Footer Text */}
          {flowStep !== 'accountType' && !flowStep.includes('signup') && (
            <div className="mt-8 text-center pt-4">
              <p className="text-xs text-neutral-400">
                {t.terms} <a href="#" className="hover:underline" style={{ color: currentTheme.primary[3] }}>{t.termsLink}</a> {t.and} <a href="#" className="hover:underline" style={{ color: currentTheme.primary[3] }}>{t.privacyLink}</a>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-0 pointer-events-none">
        <p className="text-xs font-medium text-neutral-500 opacity-60 uppercase tracking-widest">
          {t.fueledBy}
        </p>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
