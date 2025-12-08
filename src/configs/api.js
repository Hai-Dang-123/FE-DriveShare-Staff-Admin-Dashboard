// @ts-nocheck
import axios from 'axios';

// const baseURL = import.meta.env.VITE_BASE_URL;
// const baseURL = 'http://192.168.100.49:5246/api/';
const baseURL = 'http://localhost:5246/api/';

const config = {
  baseURL,
  timeout: 3000000,
};

const api = axios.create(config);
api.defaults.baseURL = baseURL;

const handleBefore = (cfg) => {
  // Public auth endpoints (don't attach Authorization header)
  // Match common variants (with or without /api prefix, case-insensitive)
  const urlRaw = (cfg.url || '').toString();
  const url = urlRaw.toLowerCase();

  // If the url contains '/auth/login' or '/auth/register' anywhere, treat as public
  if (url.includes('/auth/login') || url.includes('/auth/register')) {
    return cfg;
  }

  // Also handle cases where cfg.url may be just 'Auth/login' (no leading slash)
  if (url === 'auth/login' || url === 'auth/register') {
    return cfg;
  }

  try {
    const token = localStorage.getItem('accessToken')?.replaceAll('"', '');
    if (!cfg.headers) cfg.headers = {};
    cfg.headers['Authorization'] = token ? `Bearer ${token}` : undefined;
  } catch (err) {
    // ignore
  }

  return cfg;
};

const handleError = (error) => {
  console.error('Axios request error:', error);
  return Promise.reject(error);
};

api.interceptors.request.use(handleBefore, handleError);

export default api;