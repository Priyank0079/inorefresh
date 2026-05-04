import api from '../config';

/**
 * Send OTP for Port Login
 */
export const sendPortOTP = async (mobile) => {
  const response = await api.post('/port/auth/send-otp', { mobile });
  return response.data;
};

/**
 * Verify OTP and Login Port Manager
 */
export const verifyPortOTP = async (mobile, otp) => {
  const response = await api.post('/port/auth/verify-otp', { mobile, otp });
  return response.data;
};

/**
 * Register a new Port Partner
 */
export const registerPort = async (portData) => {
  const response = await api.post('/port/auth/register', portData);
  return response.data;
};

/**
 * Get Port Manager Profile
 */
export const getPortProfile = async (token) => {
  // Interceptor handles token, but we can pass it explicitly if needed
  const response = await api.get('/port/auth/profile', {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

/**
 * Update Port Manager Profile
 */
export const updatePortProfile = async (token, profileData) => {
  const response = await api.put('/port/auth/profile', profileData, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};
