import { useEffect, useState } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import OpsShell from '../../components/enterprise/OpsShell';
import OpsPatientIdBar from '../../components/ops/OpsPatientIdBar';
import { formatDateIN } from '../../utils/format';

const StaffPrebookDashboard = () => {
  const [prebooks, setPrebooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/ops/prebooks/pending')
      .then(({ data }) => setPrebooks(Array.isArray(data) ? data : []))
      .catch(() => setPrebooks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const checkIn = async (id) => {
    try {
      const { data } = await api.post(`/ops/prebooks/${id}/check-in`);
      toast.success(`Checked in — Token ${data.visit?.tokenNumber || '—'} · doctor queue`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  return (
    <OpsShell
      title="Pre-booked appointments"
      subtitle="VIP patients who booked online · Check in to doctor queue"
      icon={Calendar}
      role="receptionist"
      showWidgets={false}
    >
      <OpsPatientIdBar onResolved={() => load()} />

      <div className="ops-card">
        {loading ? (
          <p className="text-slate-600 text-sm">Loading…</p>
        ) : prebooks.length === 0 ? (
          <p className="text-slate-600 text-sm">No pending pre-bookings for your hospital branch.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {prebooks.map((pb) => (
              <li key={pb._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{pb.patientName || 'Patient'}</p>
                  <p className="font-mono text-sm text-blue-700">{pb.patientId}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {pb.department} · {formatDateIN(pb.scheduledAt)}
                  </p>
                  {pb.notes && <p className="text-xs text-slate-500 mt-1">{pb.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => checkIn(pb._id)}
                  className="shrink-0 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-blue-700"
                >
                  Add to doctor queue <ArrowRight className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </OpsShell>
  );
};

export default StaffPrebookDashboard;
