import { useState, useEffect, useCallback } from 'react';

import api from '../api/axios';

import { useAuth } from '../context/authStore';

import { useRealtimeQueue } from './useRealtimeQueue';



export const useOpsContext = () => {

  const { user } = useAuth();

  const [ctx, setCtx] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);



  const load = useCallback(async () => {

    if (!user?.token) return;

    if (!['staff', 'admin', 'doctor'].includes(user.role)) {

      setCtx(null);

      return;

    }

    setLoading(true);

    setError(null);

    try {

      const { data } = await api.get('/ops/context');

      setCtx(data);

    } catch (e) {

      setCtx(null);

      setError(e.response?.data?.message || 'Ops context unavailable');

    } finally {

      setLoading(false);

    }

  }, [user?.token, user?.role]);



  useEffect(() => {

    load();

  }, [load]);



  return { ctx, loading, error, refresh: load, operationalRole: ctx?.operationalRole };

};



export const useQueue = (queueType, refreshKey = 0, opsCtx = null) => {

  const [patients, setPatients] = useState([]);

  const [metrics, setMetrics] = useState(null);

  const [loading, setLoading] = useState(true);



  const fetchQueue = useCallback(async () => {

    try {

      const [q, m] = await Promise.all([

        api.get(`/queues/${queueType}`),

        api.get('/queues/metrics'),

      ]);

      setPatients(q.data.patients || []);

      setMetrics(m.data.metrics || null);

    } catch {

      setPatients([]);

    } finally {

      setLoading(false);

    }

  }, [queueType]);



  useEffect(() => {

    setLoading(true);

    fetchQueue();

  }, [queueType, refreshKey, fetchQueue]);



  useRealtimeQueue(queueType, fetchQueue, opsCtx);



  return { patients, metrics, loading, refetch: fetchQueue };

};



export const transitionVisit = (visitId, action, body = {}) =>

  api.post(`/workflow/visit/${visitId}/transition`, { action, ...body });

