import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/authStore';
import { io } from 'socket.io-client';
import { getApiOrigin } from '../api/axios';
import toast from 'react-hot-toast';

const severityForType = (type) => {
  if (type === 'emergency' || type === 'abnormal_vitals') return 'critical';
  if (type === 'consent_request' || type === 'billing_pending' || type === 'surgery_scheduled') return 'warning';
  return 'info';
};

export const useNotifications = (opsCtx) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchList = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const [list, countRes] = await Promise.all([
        api.get('/notifications', { params: { limit: 40 } }),
        api.get('/notifications/unread-count'),
      ]);
      setItems(list.data || []);
      setUnread(countRes.data?.count ?? 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const tenantSlug = opsCtx?.tenant?.slug;
    const branchSlug = opsCtx?.branch?.slug;
    if (!tenantSlug || !branchSlug || !user?.token) return undefined;

    const socket = io(`${getApiOrigin()}/queues`, { path: '/socket.io', transports: ['websocket', 'polling'] });
    socket.emit('join:branch', { tenantSlug, branchSlug });

    const onNotify = (payload) => {
      fetchList();
      const sev = severityForType(payload?.type);
      if (sev === 'critical') {
        toast(payload?.title || 'Alert', { icon: '⚠️', duration: 5000 });
      } else if (payload?.title) {
        toast(payload.title, { duration: 3500 });
      }
    };

    socket.on('notification', onNotify);
    socket.on('smart:alert', onNotify);
    socket.on('emergency:alert', onNotify);

    return () => socket.disconnect();
  }, [opsCtx?.tenant?.slug, opsCtx?.branch?.slug, user?.token, fetchList]);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    fetchList();
  };

  const markAllRead = async () => {
    await api.post('/notifications/read-all');
    fetchList();
  };

  return { items, unread, open, setOpen, loading, fetchList, markRead, markAllRead, severityForType };
};

export default useNotifications;
