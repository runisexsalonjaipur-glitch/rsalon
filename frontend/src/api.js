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

const request = async (endpoint, options = {}) => {
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
    let response;
    try {
      response = await fetch(url, config);
    } catch {
      // Network / CORS / server asleep — fetch itself rejected
      throw new Error('Unable to reach the server. Please check your internet and try again.');
    }
    
    // Auto logout on 401 or 403 (unauthorized/invalid token)
    if (response.status === 401 || response.status === 403) {
      if (!endpoint.includes('/auth/login')) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `Something went wrong (${response.status})`);
    }
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
};

// Short-lived GET cache + in-flight de-duplication.
// Pages that request the same list (staff, services, settings) share one network call,
// and revisiting a page within a few seconds is instant. Any write clears the cache.
const GET_CACHE_TTL = 20 * 1000;
const getCache = new Map();
const inFlight = new Map();

export const clearApiCache = () => {
  getCache.clear();
  inFlight.clear();
};

const apiCall = async (endpoint, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();

  if (method !== 'GET') {
    const data = await request(endpoint, options);
    clearApiCache();
    return data;
  }

  const cached = getCache.get(endpoint);
  if (cached && Date.now() - cached.ts < GET_CACHE_TTL) return cached.data;
  if (inFlight.has(endpoint)) return inFlight.get(endpoint);

  const promise = request(endpoint, options)
    .then((data) => {
      getCache.set(endpoint, { data, ts: Date.now() });
      return data;
    })
    .finally(() => inFlight.delete(endpoint));
  inFlight.set(endpoint, promise);
  return promise;
};

export default apiCall;
