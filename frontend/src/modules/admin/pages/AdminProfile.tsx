import { useState, useEffect } from 'react';
import { getProfile, updateProfile, type AdminProfile as AdminProfileType } from '../../../services/api/admin/adminProfileService';
import { useAuth } from '../../../context/AuthContext';

// ── Validation rules ─────────────────────────────────────────────────────────
const RULES = {
    firstName: (v: string) => {
        if (!v.trim()) return 'First name is required.';
        if (v.trim().length < 2) return 'First name must be at least 2 characters.';
        if (v.trim().length > 50) return 'First name must be 50 characters or fewer.';
        if (!/^[a-zA-Z\s'-]+$/.test(v.trim())) return 'First name can only contain letters, spaces, hyphens or apostrophes.';
        return '';
    },
    lastName: (v: string) => {
        if (!v.trim()) return 'Last name is required.';
        if (v.trim().length < 2) return 'Last name must be at least 2 characters.';
        if (v.trim().length > 50) return 'Last name must be 50 characters or fewer.';
        if (!/^[a-zA-Z\s'-]+$/.test(v.trim())) return 'Last name can only contain letters, spaces, hyphens or apostrophes.';
        return '';
    },
    email: (v: string) => {
        if (!v.trim()) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address (e.g. admin@example.com).';
        if (v.trim().length > 100) return 'Email must be 100 characters or fewer.';
        return '';
    },
    mobile: (v: string) => {
        if (!v.trim()) return 'Mobile number is required.';
        if (!/^\d+$/.test(v.trim())) return 'Mobile number must contain digits only.';
        if (v.trim().length !== 10) return 'Mobile number must be exactly 10 digits.';
        if (!/^[6-9]/.test(v.trim())) return 'Mobile number must start with 6, 7, 8 or 9.';
        return '';
    },
};

type FormField = keyof typeof RULES;
type FieldErrors = Record<FormField, string>;
type TouchedFields = Record<FormField, boolean>;

export default function AdminProfile() {
    const { isAuthenticated } = useAuth();
    const [profile, setProfile] = useState<AdminProfileType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
    });

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
    });

    const [touched, setTouched] = useState<TouchedFields>({
        firstName: false,
        lastName: false,
        email: false,
        mobile: false,
    });

    // Fetch profile on mount
    useEffect(() => {
        if (!isAuthenticated) { setLoading(false); return; }

        const fetchProfile = async () => {
            try {
                setLoading(true);
                setServerError(null);
                const response = await getProfile();
                if (response.success && response.data) {
                    setProfile(response.data);
                    setFormData({
                        firstName: response.data.firstName,
                        lastName: response.data.lastName,
                        email: response.data.email,
                        mobile: response.data.mobile,
                    });
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                setServerError('Failed to load profile. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [isAuthenticated]);

    // Validate single field and update errors
    const validateField = (name: FormField, value: string): string => {
        const error = RULES[name](value);
        setFieldErrors(prev => ({ ...prev, [name]: error }));
        return error;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Mobile: only allow digits
        const sanitized = name === 'mobile' ? value.replace(/\D/g, '') : value;
        setFormData(prev => ({ ...prev, [name]: sanitized }));
        // Live-validate if already touched
        if (touched[name as FormField]) {
            validateField(name as FormField, sanitized);
        }
        setServerError(null);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        validateField(name as FormField, value);
    };

    const validateAll = () => {
        const errors: FieldErrors = {
            firstName: RULES.firstName(formData.firstName),
            lastName: RULES.lastName(formData.lastName),
            email: RULES.email(formData.email),
            mobile: RULES.mobile(formData.mobile),
        };
        setFieldErrors(errors);
        setTouched({ firstName: true, lastName: true, email: true, mobile: true });
        return Object.values(errors).every(e => e === '');
    };

    const handleSave = async () => {
        setServerError(null);
        setSuccess(null);
        if (!validateAll()) return;

        try {
            setSaving(true);
            const response = await updateProfile(formData);
            if (response.success && response.data) {
                setProfile(response.data);
                setSuccess('Profile updated successfully!');
                setIsEditing(false);
                setTouched({ firstName: false, lastName: false, email: false, mobile: false });

                const userData = localStorage.getItem('userData');
                if (userData) {
                    const parsed = JSON.parse(userData);
                    Object.assign(parsed, {
                        firstName: response.data.firstName,
                        lastName: response.data.lastName,
                        email: response.data.email,
                        mobile: response.data.mobile,
                    });
                    localStorage.setItem('userData', JSON.stringify(parsed));
                }

                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setServerError(err?.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setFormData({
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                mobile: profile.mobile,
            });
        }
        setIsEditing(false);
        setServerError(null);
        setSuccess(null);
        setFieldErrors({ firstName: '', lastName: '', email: '', mobile: '' });
        setTouched({ firstName: false, lastName: false, email: false, mobile: false });
    };

    // ── Field renderer helper ────────────────────────────────────────────────
    const renderField = (
        field: FormField,
        label: string,
        type = 'text',
        hint?: string,
    ) => {
        const hasError = touched[field] && fieldErrors[field];
        const isValid = touched[field] && !fieldErrors[field] && formData[field].trim() !== '';

        return (
            <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                    {label}
                    <span className="text-red-500 ml-0.5">*</span>
                </label>
                {isEditing ? (
                    <>
                        <div className="relative">
                            <input
                                type={type}
                                name={field}
                                value={formData[field]}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                maxLength={field === 'mobile' ? 10 : undefined}
                                placeholder={
                                    field === 'firstName' ? 'Enter first name'
                                    : field === 'lastName' ? 'Enter last name'
                                    : field === 'email' ? 'admin@example.com'
                                    : '10-digit mobile number'
                                }
                                className={`w-full px-3 py-2.5 pr-9 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 ${
                                    hasError
                                        ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-500'
                                        : isValid
                                        ? 'border-green-400 bg-green-50 focus:ring-green-200 focus:border-green-500'
                                        : 'border-neutral-300 bg-white focus:ring-blue-200 focus:border-blue-500'
                                }`}
                            />
                            {/* Status icon */}
                            {hasError && (
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                    </svg>
                                </span>
                            )}
                            {isValid && (
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-3.5-3.5 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/>
                                    </svg>
                                </span>
                            )}
                        </div>
                        {/* Inline error */}
                        {hasError && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 font-medium">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                </svg>
                                {fieldErrors[field]}
                            </p>
                        )}
                        {/* Success hint */}
                        {isValid && hint && (
                            <p className="mt-1.5 text-xs text-green-600 font-medium">{hint}</p>
                        )}
                    </>
                ) : (
                    <p className="text-neutral-900 py-2 text-sm font-medium">{profile?.[field as keyof AdminProfileType] as string}</p>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex items-center gap-3 text-neutral-600">
                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    Loading profile...
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-red-600 font-medium">Failed to load profile</div>
            </div>
        );
    }

    const hasAnyError = Object.values(fieldErrors).some(e => e !== '');

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-white px-4 sm:px-6 py-4 border-b border-neutral-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Admin Profile</h1>
                    <div className="text-sm text-neutral-600">
                        <span className="text-blue-600 cursor-pointer hover:underline">Home</span>
                        {' / '}
                        <span className="text-neutral-900">Profile</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-50">
                <div className="max-w-3xl mx-auto space-y-4">

                    {/* Success banner */}
                    {success && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-300 text-green-800 rounded-xl shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 text-green-500">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-3.5-3.5 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/>
                            </svg>
                            <span className="text-sm font-semibold">{success}</span>
                        </div>
                    )}

                    {/* Server error banner */}
                    {serverError && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-300 text-red-800 rounded-xl shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 text-red-500">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>
                            <span className="text-sm font-semibold">{serverError}</span>
                        </div>
                    )}

                    {/* Profile Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                        {/* Card Header */}
                        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-neutral-900">Profile Information</h2>
                                {isEditing && (
                                    <p className="text-xs text-neutral-500 mt-0.5">Fields marked <span className="text-red-500 font-bold">*</span> are required</p>
                                )}
                            </div>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {/* Card Body */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {renderField('firstName', 'First Name', 'text', 'Looks good!')}
                                {renderField('lastName', 'Last Name', 'text', 'Looks good!')}
                                {renderField('email', 'Email Address', 'email', 'Valid email address!')}
                                {renderField('mobile', 'Mobile Number', 'tel', 'Valid mobile number!')}

                                {/* Role (read-only) */}
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Role</label>
                                    <p className="py-2">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider">
                                            {profile.role}
                                        </span>
                                    </p>
                                </div>

                                {/* Created At (read-only) */}
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Created At</label>
                                    <p className="text-neutral-700 py-2 text-sm">{new Date(profile.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Validation summary when trying to save with errors */}
                            {isEditing && hasAnyError && Object.values(touched).some(Boolean) && (
                                <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
                                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                                        </svg>
                                        Please fix the errors above before saving.
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {isEditing && (
                                <div className="mt-6 flex items-center gap-3">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-[#12b2a2] hover:bg-[#0e7490] text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                                    <polyline points="17 21 17 13 7 13 7 21"/>
                                                    <polyline points="7 3 7 8 15 8"/>
                                                </svg>
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={saving}
                                        className="px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
