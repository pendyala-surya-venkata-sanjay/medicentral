import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  withCredentials: true,
});

const persistToken = (token) => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo || !token) return;
  try {
    const parsed = JSON.parse(userInfo);
    parsed.token = token;
    parsed.accessToken = token;
    localStorage.setItem('userInfo', JSON.stringify(parsed));
  } catch {
    localStorage.removeItem('userInfo');
  }
};

api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const { token } = JSON.parse(userInfo);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        localStorage.removeItem('userInfo');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      if (!refreshing) {
        refreshing = true;
        try {
          const { data } = await axios.post(
            `${API_BASE}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          persistToken(data.accessToken || data.token);
          refreshing = false;
          original.headers.Authorization = `Bearer ${data.accessToken || data.token}`;
          return api(original);
        } catch {
          refreshing = false;
        }
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('userInfo');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getApiOrigin = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  if (base.startsWith('/')) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  return base.replace(/\/api\/?$/, '');
};

export default api;
