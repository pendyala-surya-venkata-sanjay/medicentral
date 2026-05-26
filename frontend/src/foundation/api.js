/**
 * Foundation API client — architecture metadata (Phase 0).
 * Legacy features continue using src/api/axios.js.
 */
import api from '../api/axios';

export const fetchArchitecture = () => api.get('/foundation/architecture');
export const fetchWorkflowFoundation = () => api.get('/foundation/workflow');
export const fetchQueueFoundation = () => api.get('/foundation/queues');
export const fetchTenants = () => api.get('/foundation/tenants');
export const fetchRolesFoundation = () => api.get('/foundation/roles');
