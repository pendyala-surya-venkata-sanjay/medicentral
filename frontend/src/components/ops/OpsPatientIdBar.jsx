import { useState } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const OpsPatientIdBar = ({ onResolved, placeholder = 'Enter Patient ID (e.g. MC-PT-1001)' }) => {
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  // Never auto-display patient details in the lookup bar.

  const lookup = async () => {
    const id = patientId.trim();
    if (!id) return toast.error('Enter a Patient ID');
    setLoading(true);
    try {
      const { data } = await api.get(`/ops/patients/lookup?patientId=${encodeURIComponent(id)}`);
      onResolved?.(data);
      if (data?.restricted) toast(`Locked: ${data.message}`);
      else toast.success(`Loaded ${data.patient?.name || id}`);
    } catch (err) {
      onResolved?.(null);
      toast.error(err.response?.data?.message || 'Patient not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
        <Search className="w-4 h-4 text-blue-600" /> Patient ID lookup
      </h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && lookup()}
          placeholder={placeholder}
          className="ops-input flex-1 font-mono"
        />
        <button
          type="button"
          onClick={lookup}
          disabled={loading}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Load patient'}
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Note: Patient details are shown only when your role is allowed for the current stage.
      </p>
    </div>
  );
};

export default OpsPatientIdBar;
