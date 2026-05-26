import { useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { getApiOrigin } from '../api/axios';
import toast from 'react-hot-toast';

/**
 * Live queue refresh via Socket.IO (enabled on backend unless ENABLE_SOCKET=false).
 */
export const useRealtimeQueue = (queueType, onRefresh, ctx) => {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const tenantSlug = ctx?.tenant?.slug;
  const branchSlug = ctx?.branch?.slug;

  const stableRefresh = useCallback(() => {
    onRefreshRef.current?.();
  }, []);

  useEffect(() => {
    if (!tenantSlug || !branchSlug) return undefined;

    const socket = io(`${getApiOrigin()}/queues`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    socket.emit('join:branch', { tenantSlug, branchSlug });

    const handler = (payload) => {
      stableRefresh();
      if (payload?.type === 'emergency' || payload?.priority === 'critical') {
        toast('Emergency patient update', { icon: '⚠️' });
      } else if (payload?.title) {
        toast(payload.title, { duration: 3000 });
      }
    };

    socket.on('workflow:updated', stableRefresh);
    socket.on('queue:item:added', stableRefresh);
    socket.on('queue:item:updated', stableRefresh);
    socket.on('patient:admitted', stableRefresh);
    socket.on('vitals:updated', stableRefresh);
    socket.on('surgery:scheduled', stableRefresh);
    socket.on('surgery:completed', stableRefresh);
    socket.on('pharmacy:ready', stableRefresh);
    socket.on('discharge:ready', stableRefresh);
    socket.on('consent:requested', handler);
    socket.on('consent:approved', handler);
    socket.on('cross_hospital:access_granted', handler);
    socket.on('timeline:shared', stableRefresh);
    socket.on('tenant:activity', handler);
    socket.on('smart:alert', stableRefresh);
    socket.on('notification', handler);

    return () => {
      socket.emit('leave:branch', { tenantSlug, branchSlug });
      socket.disconnect();
    };
  }, [tenantSlug, branchSlug, stableRefresh]);

  return { connected: !!tenantSlug };
};
