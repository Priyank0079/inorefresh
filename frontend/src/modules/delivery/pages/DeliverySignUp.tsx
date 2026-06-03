import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  register,
  sendOTP,
  verifyOTP,
} from "../../../services/api/auth/deliveryAuthService";
import { uploadDocument } from "../../../services/api/uploadService";
import OTPInput from "../../../components/OTPInput";
import { useAuth } from "../../../context/AuthContext";

export default function DeliverySignUp() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [formData, setFormData] = useState(() => {
    const defaults = {
      name: "",
      mobile: "",
      email: "",
      dateOfBirth: "",
      password: "",
      address: "",
      city: "",
      pincode: "",
      accountName: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      bonusType: "",
    };
    // Restore a saved draft so a page refresh doesn't wipe everything the user
    // typed. The password is never persisted/restored.
    try {
      const saved = localStorage.getItem("delivery_signup_draft");
      if (saved) {
        return { ...defaults, ...(JSON.parse(saved) as Partial<typeof defaults>), password: "" };
      }
    } catch {
      /* ignore a corrupt draft */
    }
    return defaults;
  });

  // Clear any existing session on mount
  useEffect(() => {
    logout();
  }, [logout]);

  // Persist the form (minus password) on every change so a refresh keeps it.
  useEffect(() => {
    const { password, ...rest } = formData;
    void password;
    try {
      localStorage.setItem("delivery_signup_draft", JSON.stringify(rest));
    } catch {
      /* ignore storage quota errors */
    }
  }, [formData]);

  const [showOTP, setShowOTP] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCityLoading, setIsCityLoading] = useState(false);

  // Document upload state (#11, #12)
  const [showPassword, setShowPassword] = useState(false);
  const [drivingLicenseFile, setDrivingLicenseFile] = useState<File | null>(null);
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [drivingLicensePreview, setDrivingLicensePreview] = useState<string>("");
  const [nationalIdPreview, setNationalIdPreview] = useState<string>("");

  // Max DOB: must be at least 18 years old (#8)
  const maxDOB = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split("T")[0];
  })();

  const handleDocumentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "drivingLicense" | "nationalId"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Phone camera photos are often >5MB, so the old 5MB cap silently rejected
    // images captured with the camera ("captured but not added"). Use 10MB to
    // match the backend's document upload limit (MAX_DOCUMENT_SIZE).
    if (file.size > 10 * 1024 * 1024) {
      setError("Document file must be under 10MB");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    if (type === "drivingLicense") {
      setDrivingLicenseFile(file);
      setDrivingLicensePreview(previewUrl);
    } else {
      setNationalIdFile(file);
      setNationalIdPreview(previewUrl);
    }
  };

  const bonusTypes = [
    "Select Bonus Type",
    "Fixed or Salaried",
    "Fixed",
    "Salaried",
    "Commission Based",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, "").slice(0, 10),
      }));
    } else if (name === "name" || name === "accountName") {
      // Letters and spaces only for name fields
      setFormData((prev) => ({
        ...prev,
        [name]: value.replace(/[^a-zA-Z\s]/g, ""),
      }));
    } else if (name === "city") {
      // City: letters and spaces only (no digits, no special characters)
      setFormData((prev) => ({
        ...prev,
        [name]: value.replace(/[^a-zA-Z\s]/g, ""),
      }));
    } else if (name === "address") {
      // Address: allow letters, digits, spaces and common address punctuation
      // (, . - / #), strip other special characters.
      setFormData((prev) => ({
        ...prev,
        [name]: value.replace(/[^a-zA-Z0-9\s,.\-/#]/g, ""),
      }));
    } else if (name === "pincode") {
      // Digits only, max 6
      setFormData((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, "").slice(0, 6),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const fetchCityFromLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsCityLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();
          if (data.status === "OK") {
            const addressComponents = data.results[0].address_components;
            const cityComponent = addressComponents.find((c: any) =>
              c.types.includes("locality") || c.types.includes("administrative_area_level_2")
            );
            if (cityComponent) {
              setFormData((prev) => ({ ...prev, city: cityComponent.long_name }));
            }
          } else {
            setError("Could not fetch city from your location");
          }
        } catch (err) {
          setError("Failed to fetch city details");
        } finally {
          setIsCityLoading(false);
        }
      },
      (err) => {
        setError("Location access denied. Please type your city manually.");
        setIsCityLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.name ||
      !formData.mobile ||
      !formData.email ||
      !formData.password ||
      !formData.address ||
      !formData.city
    ) {
      setError("Please fill all required fields");
      return;
    }

    if (formData.mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      setError("Name must contain letters only");
      return;
    }

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const ageDiff = Date.now() - dob.getTime();
      const ageYears = ageDiff / (1000 * 60 * 60 * 24 * 365.25);
      if (ageYears < 18) {
        setError("You must be at least 18 years old to register");
        return;
      }
    }

    if (/[0-9]/.test(formData.city)) {
      setError("City name should not contain numbers");
      return;
    }

    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      setError("Pincode must be exactly 6 digits");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formData.ifscCode.trim())) {
      setError("IFSC code format is invalid (e.g. HDFC0001234)");
      return;
    }

    if (formData.accountNumber && !/^\d{9,18}$/.test(formData.accountNumber.trim())) {
      setError("Account number must be 9–18 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Upload the captured documents first so their URLs are saved with the
      // registration. Previously the files were collected but never sent, so
      // the driving licence / Aadhaar were lost.
      let drivingLicenseUrl: string | undefined;
      let nationalIdUrl: string | undefined;
      try {
        if (drivingLicenseFile) {
          const up = await uploadDocument(drivingLicenseFile, "delivery-documents");
          drivingLicenseUrl = up.secureUrl || up.url;
        }
        if (nationalIdFile) {
          const up = await uploadDocument(nationalIdFile, "delivery-documents");
          nationalIdUrl = up.secureUrl || up.url;
        }
      } catch (uploadErr: any) {
        setLoading(false);
        setError(
          uploadErr?.response?.data?.message ||
            "Failed to upload documents. Please try again."
        );
        return;
      }

      const response = await register({
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth || undefined,
        password: formData.password,
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode || undefined,
        accountName: formData.accountName || undefined,
        bankName: formData.bankName || undefined,
        accountNumber: formData.accountNumber || undefined,
        ifscCode: formData.ifscCode || undefined,
        bonusType: formData.bonusType || undefined,
        drivingLicense: drivingLicenseUrl,
        nationalIdentityCard: nationalIdUrl,
      });

      if (response.success) {
        // Clear token from registration (we'll get it after OTP verification)
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        // Registration successful, now send SMS OTP for verification
        try {
          const otpRes = await sendOTP(formData.mobile);
          if (otpRes.sessionId) setSessionId(otpRes.sessionId);
          setShowOTP(true);
        } catch (otpErr: any) {
          setError(
            otpErr.message ||
            "Registration successful but failed to send OTP."
          );
        }
      }
    } catch (err: any) {
      setError(
        err.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await verifyOTP(formData.mobile, otp, sessionId);
      if (response.success) {
        // Registration complete — discard the saved draft.
        try { localStorage.removeItem("delivery_signup_draft"); } catch { /* ignore */ }
        navigate("/delivery");
      }
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex flex-col items-center justify-center px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-neutral-50 transition-colors"
        aria-label="Back">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "black" }}
          />
        </svg>
      </button>

      {/* Sign Up Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header Section */}
        <div className="px-6 py-6 text-center bg-gradient-to-br from-teal-700 to-teal-900">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/Inor fresh.png"
              alt="Inor Fresh Delivery"
              className="h-28 w-auto object-contain bg-white/90 rounded-xl p-2 shadow-sm"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Delivery Sign Up
          </h1>
          <p className="text-teal-100 text-sm">
            Create your delivery partner account
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="p-6 space-y-4">
          {!showOTP ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-700 border-b pb-2">
                  Personal Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    pattern="[a-zA-Z\s]+"
                    title="Name should contain letters and spaces only"
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center bg-white border border-neutral-300 rounded-lg overflow-hidden focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-200">
                    <div className="px-3 py-2.5 text-sm font-medium text-neutral-600 border-r border-neutral-300 bg-neutral-50">
                      +91
                    </div>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="Enter mobile number"
                      required
                      maxLength={10}
                      className="flex-1 px-3 py-2.5 text-sm placeholder:text-neutral-400 focus:outline-none"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    max={maxDOB}
                    title="You must be at least 18 years old"
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}
                  />
                  <p className="text-xs text-neutral-400 mt-1">Must be 18 years or older</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password (min 6 characters)"
                      required
                      minLength={6}
                      className="w-full px-3 py-2.5 pr-10 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    required
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter your city"
                      required
                      pattern="[^0-9]+"
                      title="City name should not contain numbers"
                      className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                      disabled={loading || isCityLoading}
                    />
                    <button
                      type="button"
                      onClick={fetchCityFromLocation}
                      disabled={isCityLoading || loading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-teal-600 hover:bg-teal-50 rounded-md transition-colors disabled:text-neutral-400"
                      title="Fetch current location"
                    >
                      {isCityLoading ? (
                        <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="tel"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit pincode"
                    maxLength={6}
                    pattern="\d{6}"
                    title="Pincode must be exactly 6 digits"
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Document Uploads — Bug #11, #12 */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-neutral-700 border-b pb-2">
                  Documents <span className="text-neutral-400 font-normal">(Required for verification)</span>
                </h3>

                {/* Driving License */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Driving License <span className="text-red-500">*</span>
                  </label>
                  <label className="flex items-center gap-3 w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <span className="text-neutral-500 flex-1 truncate">
                      {drivingLicenseFile ? drivingLicenseFile.name : "Upload driving license (JPG/PNG/PDF, max 10MB)"}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleDocumentChange(e, "drivingLicense")}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                  {drivingLicensePreview && drivingLicenseFile?.type.startsWith("image/") && (
                    <img src={drivingLicensePreview} alt="Driving License Preview" className="mt-2 h-16 object-contain rounded border border-neutral-200" />
                  )}
                  {drivingLicensePreview && drivingLicenseFile?.type === "application/pdf" && (
                    <p className="mt-1 text-xs text-teal-600">✓ PDF selected: {drivingLicenseFile.name}</p>
                  )}
                </div>

                {/* National ID (Aadhaar) */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    National ID / Aadhaar <span className="text-red-500">*</span>
                  </label>
                  <label className="flex items-center gap-3 w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <span className="text-neutral-500 flex-1 truncate">
                      {nationalIdFile ? nationalIdFile.name : "Upload Aadhaar / national ID (JPG/PNG/PDF, max 10MB)"}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleDocumentChange(e, "nationalId")}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                  {nationalIdPreview && nationalIdFile?.type.startsWith("image/") && (
                    <img src={nationalIdPreview} alt="National ID Preview" className="mt-2 h-16 object-contain rounded border border-neutral-200" />
                  )}
                  {nationalIdPreview && nationalIdFile?.type === "application/pdf" && (
                    <p className="mt-1 text-xs text-teal-600">✓ PDF selected: {nationalIdFile.name}</p>
                  )}
                </div>
              </div>

              {/* Bank Information */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-neutral-700 border-b pb-2">
                  Bank Account Information (Optional)
                </h3>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleInputChange}
                    placeholder="Account holder name"
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="Bank name"
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    placeholder="Account number (digits only)"
                    maxLength={18}
                    pattern="\d{9,18}"
                    title="Account number must be 9–18 digits"
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}
                    onChange={(e) => setFormData((prev) => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 18) }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    placeholder="IFSC code (e.g. HDFC0001234)"
                    maxLength={11}
                    pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}"
                    title="IFSC format: 4 letters, 0, then 6 alphanumeric (e.g. HDFC0001234)"
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Bonus Type
                  </label>
                  <select
                    name="bonusType"
                    value={formData.bonusType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}>
                    {bonusTypes.map((type) => (
                      <option
                        key={type}
                        value={type === "Select Bonus Type" ? "" : type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>



              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${!loading
                  ? 'bg-gradient-to-r from-teal-700 to-teal-900 text-white hover:from-teal-800 hover:to-teal-950'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  }`}
              >
                {loading
                    ? "Creating Account..."
                    : "Sign Up"}
              </button>

              {/* Login Link */}
              <div className="text-center pt-2 border-t border-neutral-200">
                <p className="text-sm text-neutral-600">
                  Already have a delivery partner account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/delivery/login")}
                    className="text-teal-800 hover:text-teal-950 font-bold ml-1 transition-colors">
                    Login
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* OTP Verification Form */
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-neutral-600 mb-2">
                  Enter the 4-digit OTP sent via voice call to
                </p>
                <p className="text-sm font-semibold text-neutral-800">
                  +91 {formData.mobile}
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
                  onClick={() => {
                    setShowOTP(false);
                    setError("");
                  }}
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg font-bold text-sm bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors border border-neutral-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                  Back
                </button>
                <button
                  onClick={async () => {
                    setLoading(true);
                    setError("");
                    try {
                      const res = await sendOTP(formData.mobile);
                      if (res.sessionId) setSessionId(res.sessionId);
                    } catch (err: any) {
                      setError(
                        err.message || "Failed to resend OTP."
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg font-bold text-sm bg-gradient-to-r from-teal-700 to-teal-900 text-white hover:from-teal-800 hover:to-teal-950 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                  {loading ? "Calling..." : "Resend OTP"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Text — Bug #161 */}
      <p className="mt-6 text-xs text-neutral-500 text-center max-w-md">
        By continuing, you agree to Inor Fresh's{' '}
        <Link to="/terms" target="_blank" className="text-teal-600 underline underline-offset-2 hover:text-teal-700">
          Terms of Service
        </Link>
        {' '}and{' '}
        <Link to="/privacy-policy" target="_blank" className="text-teal-600 underline underline-offset-2 hover:text-teal-700">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}

