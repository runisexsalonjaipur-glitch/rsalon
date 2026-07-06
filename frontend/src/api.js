const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Base URL without /api — used for health ping
const BASE_URL = API_URL.replace(/\/api$/, '');

// Create helper to get token
export const getToken = () => localStorage.getItem('token');
export const getUserRole = () => localStorage.getItem('role');
export const getUsername = () => localStorage.getItem('username');

// Ping Railway to wake up from cold start (silent — no error thrown)
export const pingServer = () => {
  fetch(`${BASE_URL}/`, { method: 'GET' }).catch(() => {});
};

// Simple header helper
export const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const headers = getHeaders();
  
  const config = {
    method: options.method || 'GET',
    headers,
    ...options
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    
    // Auto logout on 401 or 403 (unauthorized/invalid token)
    if (response.status === 401 || response.status === 403) {
      if (!endpoint.includes('/auth/login')) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Something went wrong');
    }
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
};

export default apiCall;
