import React, { useState, useEffect } from 'react';
import PageTitle from '../../components/common/PageTitle';
import { useAuth } from '@/context/AuthContext';
import { getPortProfile, updatePortProfile } from '@/services/api/auth/portAuthService';
import { uploadImage } from '@/services/api/uploadService';
import CameraCapture from '@/components/CameraCapture';
import { useRef } from 'react';

const ProfileSettings = () => {
  const { token, user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showImageCamera, setShowImageCamera] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    portName: '',
    managerName: '',
    email: '',
    mobile: '',
    location: '',
    licenseNumber: '',
    profileImage: ''
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getPortProfile(token);
        console.log("Fetched profile data:", response.data);
        if (response.success) {
          const profileData = response.data;
          setFormData({
            portName: profileData.portName || '',
            managerName: response.data.managerName || '',
            email: response.data.email || '',
            mobile: response.data.mobile || '',
            location: response.data.location || '',
            licenseNumber: response.data.licenseNumber || '',
            profileImage: response.data.profileImage || ''
          });
        }
      } catch (err) {
        console.error("Error fetching profile details:", err);
        const status = err.response?.status;
        const message = err.response?.data?.message || err.message;
        setError(`Failed to load profile [Status: ${status}]. ${message}`);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  const validateForm = () => {
    const errors = {};
    
    // Port Name validation
    if (!formData.portName.trim()) {
      errors.portName = "Port name is required";
    } else if (formData.portName.trim().length < 3) {
      errors.portName = "Port name must be at least 3 characters";
    }

    // Manager Name validation
    if (!formData.managerName.trim()) {
      errors.managerName = "Manager name is required";
    } else if (!/^[a-zA-Z\s.-]+$/.test(formData.managerName.trim())) {
      errors.managerName = "Can only contain letters, spaces, dots, and hyphens";
    } else if (formData.managerName.trim().length < 2) {
      errors.managerName = "Manager name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    // Location validation
    if (!formData.location.trim()) {
      errors.location = "Location is required";
    } else if (formData.location.trim().length < 3) {
      errors.location = "Location must be at least 3 characters";
    }

    // License Number validation
    if (!formData.licenseNumber.trim()) {
      errors.licenseNumber = "License number is required";
    } else if (!/^[a-zA-Z0-9-]+$/.test(formData.licenseNumber.trim())) {
      errors.licenseNumber = "Can only contain letters, numbers, and hyphens";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (!token) {
      setError("Session expired. Please login again.");
      setSaving(false);
      return;
    }

    if (!validateForm()) {
      setError("Please fix the errors in the form before saving.");
      setSaving(false);
      return;
    }

    try {
      console.log("Submitting profile update:", formData);
      const response = await updatePortProfile(token, formData);
      if (response.success) {
        setSuccess(response.message || "Profile updated successfully!");
        updateUser(response.data);
      } else {
        setError(response.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.response?.data?.message || err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const processProfileImageFile = async (file) => {
    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const result = await uploadImage(file, 'dhakadsnazzy/port/profile');
      setFormData(prev => ({ ...prev, profileImage: result.secureUrl }));
      setSuccess("Image uploaded! Don't forget to save changes.");
    } catch (err) {
      setError("Failed to upload image. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processProfileImageFile(file);
  };

  const handleImageCameraCapture = (file) => {
    void processProfileImageFile(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageTitle 
        title="Profile Settings" 
        subtitle="Manage your port company profile and contact information"
      />

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md">
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center">
            <div className="relative group">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/*"
              />
              <div className="w-32 h-32 rounded-full bg-teal-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-xl overflow-hidden uppercase">
                {formData.profileImage ? (
                  <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (formData.portName || 'P').charAt(0)
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleImageClick}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-slate-500 hover:text-teal-600 transition-all z-10"
                title="Choose from gallery"
              >
                <span className="material-icons-outlined text-lg">photo_library</span>
              </button>
              <button
                type="button"
                onClick={() => setShowImageCamera(true)}
                disabled={uploading}
                className="absolute bottom-0 left-0 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-slate-500 hover:text-teal-600 transition-all z-10"
                title="Take a photo"
              >
                <span className="material-icons-outlined text-lg">photo_camera</span>
              </button>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-800">{formData.portName || 'Loading...'}</h3>
            <p className="text-sm text-slate-500">Port Manager: {formData.managerName || '...'}</p>
            <div className="mt-6 w-full pt-6 border-t border-slate-50 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Verification Status</span>
                <span className="text-emerald-600 flex items-center gap-1">
                  <span className="material-icons-outlined text-sm">verified</span>
                  Verified
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[100%]"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Company Information</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Port Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.portName} 
                    onChange={(e) => {
                      setFormData({...formData, portName: e.target.value});
                      if (formErrors.portName) setFormErrors({...formErrors, portName: ''});
                    }}
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${
                      formErrors.portName 
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
                        : 'border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500'
                    }`}
                  />
                  {formErrors.portName && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.portName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manager Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.managerName} 
                    onChange={(e) => {
                      setFormData({...formData, managerName: e.target.value});
                      if (formErrors.managerName) setFormErrors({...formErrors, managerName: ''});
                    }}
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${
                      formErrors.managerName 
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
                        : 'border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500'
                    }`}
                  />
                  {formErrors.managerName && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.managerName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      if (formErrors.email) setFormErrors({...formErrors, email: ''});
                    }}
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${
                      formErrors.email 
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
                        : 'border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500'
                    }`}
                  />
                  {formErrors.email && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
                  <input 
                    type="text" 
                    value={formData.mobile} 
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed outline-none transition-all" 
                    disabled
                  />
                  <p className="text-[10px] text-slate-400 italic">Contact number cannot be changed</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location (City/State) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.location} 
                    onChange={(e) => {
                      setFormData({...formData, location: e.target.value});
                      if (formErrors.location) setFormErrors({...formErrors, location: ''});
                    }}
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${
                      formErrors.location 
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
                        : 'border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500'
                    }`}
                  />
                  {formErrors.location && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.location}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fishing License No. <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.licenseNumber} 
                    onChange={(e) => {
                      setFormData({...formData, licenseNumber: e.target.value});
                      if (formErrors.licenseNumber) setFormErrors({...formErrors, licenseNumber: ''});
                    }}
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${
                      formErrors.licenseNumber 
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
                        : 'border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500'
                    }`}
                  />
                  {formErrors.licenseNumber && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.licenseNumber}</p>}
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button 
                  type="submit" 
                  disabled={saving}
                  className={`px-8 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showImageCamera && (
        <CameraCapture
          onCapture={handleImageCameraCapture}
          onClose={() => setShowImageCamera(false)}
        />
      )}
    </div>
  );
};

export default ProfileSettings;
