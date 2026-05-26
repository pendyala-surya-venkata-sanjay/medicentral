import { useState, useEffect } from 'react';
import { Shield, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const ConsentRequestsPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/consent/my');
      setRequests(data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resolve = async (id, approve, accessDuration = 'temporary') => {
    try {
      await api.post(`/consent/${id}/resolve`, { approve, accessDuration });
      toast.success(approve ? 'Access approved' : 'Request declined');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const pending = requests.filter((r) => r.status === 'PENDING' || r.status === 'pending');
  if (loading || pending.length === 0) return null;

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-5 space-y-3">
      <div className="flex items-center gap-2 text-violet-900">
        <Shield className="w-5 h-5" />
        <h2 className="font-bold">Cross-hospital access requests</h2>
      </div>
      <p className="text-sm text-violet-800/90">
        Hospitals can request scoped access to your records. Approve only if you trust the request.
      </p>
      {pending.map((r) => (
        <div
          key={r._id}
          className="bg-white rounded-xl border border-violet-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <p className="font-semibold text-slate-800">{r.requestingTenant?.name || 'Hospital'}</p>
            <p className="text-xs text-slate-500 mt-1">
              From: {r.grantingTenant?.name || 'Your records'} → To: {r.requestingTenant?.name}
            </p>
            <p className="text-xs text-slate-500">
              Scope: {r.scopeLevel || (r.scope || []).join(', ')}
              {r.accessDuration ? ` · ${r.accessDuration}` : ''}
              {r.notes ? ` · ${r.notes}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => resolve(r._id, true)}
              className="inline-flex items-center gap-1 bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-semibold"
            >
              <Check className="w-4 h-4" /> Approve
            </button>
            <button
              type="button"
              onClick={() => resolve(r._id, false)}
              className="inline-flex items-center gap-1 border border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm font-semibold"
            >
              <X className="w-4 h-4" /> Deny
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConsentRequestsPanel;
