import { useState, useEffect } from 'react';
import api from '../api/axios';
import { AuthContext } from './authStore';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch {
      localStorage.removeItem('userInfo');
      return null;
    }
  });
  const [loading, setLoading] = useState(!!localStorage.getItem('userInfo'));

  useEffect(() => {
    const syncProfile = async () => {
      const stored = localStorage.getItem('userInfo');
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        if (!parsed?.token) {
          setLoading(false);
          return;
        }
        const { data } = await api.get('/auth/profile');
        const merged = {
          ...parsed,
          name: data.user?.name ?? parsed.name,
          role: data.user?.role ?? parsed.role,
          operationalRole: data.operationalRole ?? parsed.operationalRole,
          patientId: data.patientId ?? data.profile?.patientId ?? parsed.patientId,
          doctorId: data.doctorId ?? data.profile?.doctorId ?? parsed.doctorId,
        };
        setUser(merged);
        localStorage.setItem('userInfo', JSON.stringify(merged));
      } catch {
        /* 401 handled by axios interceptor */
      } finally {
        setLoading(false);
      }
    };

    syncProfile();
  }, []);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* clear local session regardless */
    }
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
