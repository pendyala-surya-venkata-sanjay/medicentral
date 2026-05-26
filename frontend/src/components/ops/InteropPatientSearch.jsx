import { useState } from 'react';
import { Search, Shield, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import TreatmentTimeline from '../clinical/TreatmentTimeline';

const InteropPatientSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [scopeLevel, setScopeLevel] = useState('full_access');
  const [duration, setDuration] = useState('temporary');

  const search = async () => {
    if (!query.trim()) return;
    try {
      const { data } = await api.get('/interop/search', { params: { q: query } });
      setResults(data.patients || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed');
    }
  };

  const requestAccess = async (patientId, grantingSlug) => {
    try {
      await api.post('/consent/request', {
        patientId,
        scopeLevel,
        accessDuration: duration,
        grantingTenantSlug: grantingSlug,
        notes: 'Cross-hospital continuity request',
      });
      toast.success('Access request sent — awaiting patient approval');
      search();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    }
  };

  const openTimeline = async (patientId) => {
    setSelected(patientId);
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 text-indigo-900">
        <Shield className="w-5 h-5" />
        <h2 className="font-bold">Cross-hospital patient search</h2>
      </div>
      <p className="text-sm text-slate-600">
        Find patients across Apollo & Yashoda. Request consent before viewing external records.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          className="flex-1 min-w-[12rem] border rounded-lg px-3 py-2 text-sm"
          placeholder="Patient ID, phone, name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <select value={scopeLevel} onChange={(e) => setScopeLevel(e.target.value)} className="border rounded-lg px-2 text-sm">
          <option value="timeline_only">Timeline only</option>
          <option value="reports_only">Reports only</option>
          <option value="full_access">Full access</option>
        </select>
        <select value={duration} onChange={(e) => setDuration(e.target.value)} className="border rounded-lg px-2 text-sm">
          <option value="temporary">30 days</option>
          <option value="permanent">1 year</option>
        </select>
        <button type="button" onClick={search} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1">
          <Search className="w-4 h-4" /> Search
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {results.map((p) => (
          <div key={p.patientId} className="border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{p.name || p.patientId}</p>
              <p className="text-xs text-slate-500 font-mono">{p.patientId}</p>
              <p className="text-xs text-indigo-700 mt-1">
                {p.hospitals?.map((h) => h.name).join(' → ')}
              </p>
            </div>
            <div className="flex gap-2">
              {p.hasAccess ? (
                <button
                  type="button"
                  onClick={() => openTimeline(p.patientId)}
                  className="text-xs bg-emerald-600 text-white px-3 py-2 rounded-lg font-semibold flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" /> View history
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => requestAccess(p.patientId, p.suggestedGrantingSlug)}
                  className="text-xs bg-violet-600 text-white px-3 py-2 rounded-lg font-semibold flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" /> Request access
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="border-t pt-4">
          <p className="text-xs font-bold text-emerald-700 mb-2">Shared medical timeline</p>
          <TreatmentTimeline patientId={selected} refreshKey={selected} />
        </div>
      )}
    </div>
  );
};

export default InteropPatientSearch;
