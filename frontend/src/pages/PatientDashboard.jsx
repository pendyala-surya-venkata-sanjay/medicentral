import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { BrainCircuit } from 'lucide-react';
import { useAuth } from '../context/authStore';
import SmartWelcome from '../components/patient/SmartWelcome';
import HealthSnapshot from '../components/patient/HealthSnapshot';
import StatusWidgets from '../components/patient/StatusWidgets';
import PrescriptionAlertsPanel from '../components/patient/PrescriptionAlertsPanel';
import CinematicTimeline from '../components/patient/CinematicTimeline';
import PrebookVIP from '../components/patient/PrebookVIP';
import PatientHubNav from '../components/patient/PatientHubNav';
import ConsentRequestsPanel from '../components/patient/ConsentRequestsPanel';
import PatientUploadCenter from '../components/patient/PatientUploadCenter';
import RecordCard from '../components/RecordCard';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('home');
  const [cockpit, setCockpit] = useState(null);
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timelineKey, setTimelineKey] = useState(0);

  const load = useCallback(async () => {
    try {
      const [cockpitRes, statsRes, recordsRes] = await Promise.all([
        api.get('/patient-portal/cockpit'),
        api.get('/stats/patient'),
        api.get('/records/patient').catch(() => ({ data: [] })),
      ]);
      setCockpit(cockpitRes.data);
      setStats(statsRes.data);
      setRecords(Array.isArray(recordsRes.data) ? recordsRes.data : []);
    } catch {
      toast.error('Failed to load your health hub');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patientId = cockpit?.patientId || stats?.patientId || user?.patientId;

  const copyPatientId = () => {
    if (patientId) {
      navigator.clipboard.writeText(patientId);
      toast.success('Patient ID copied');
    }
  };

  if (loading) {
    return (
      <div className="patient-hub -m-4 sm:-m-6 lg:-m-8 p-6 min-h-[70vh] space-y-4">
        <div className="shimmer-bg h-32 rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shimmer-bg h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="patient-hub -m-4 sm:-m-6 lg:-m-8 p-5 sm:p-8 lg:p-10 min-h-full pb-28">
      <div className="max-w-6xl mx-auto space-y-8">
        <SmartWelcome cockpit={cockpit} patientId={patientId} onCopyId={copyPatientId} />

        <PatientHubNav active={tab} onChange={setTab} />

        {tab === 'home' && (
          <>
            <StatusWidgets cockpit={cockpit} />
            <PrescriptionAlertsPanel alerts={cockpit?.prescriptionAlerts} />
            <HealthSnapshot cockpit={cockpit} stats={stats} />
            <ConsentRequestsPanel />
            {cockpit?.aiSummary?.narrative && (
              <div className="patient-glass rounded-2xl p-6 border border-blue-100">
                <p className="text-xs text-blue-600 uppercase tracking-wider mb-3 font-semibold">Care insight</p>
                <p className="text-sm text-slate-700 leading-relaxed">{cockpit.aiSummary.narrative}</p>
              </div>
            )}
            <Link
              to="/prediction"
              className="patient-glass rounded-2xl p-6 flex items-center justify-between group hover:border-blue-200 transition border border-slate-200"
            >
              <div>
                <p className="font-bold text-slate-900 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-violet-600" /> Symptom Assistant
                </p>
                <p className="text-xs text-slate-600 mt-2">Clinical-style triage guidance — not a diagnosis</p>
              </div>
              <span className="text-blue-600 text-sm font-semibold group-hover:translate-x-1 transition">
                Open →
              </span>
            </Link>
          </>
        )}

        {tab === 'journey' && (
          <CinematicTimeline
            patientId={patientId}
            refreshKey={timelineKey}
            hospitals={cockpit?.consent?.hospitalsWithAccess}
          />
        )}

        {tab === 'prebook' && (
          <PrebookVIP cockpit={cockpit} onRefresh={load} />
        )}

        {tab === 'records' && (
          <div className="space-y-6">
            <PatientUploadCenter onUploaded={() => setTimelineKey((k) => k + 1)} />
            <div className="patient-glass rounded-2xl p-6 sm:p-8">
              <h3 className="font-bold text-slate-900 mb-6">Medical records</h3>
              {records.length > 0 ? (
                <div className="space-y-3">
                  {records.map((r) => (
                    <div key={r._id} className="rounded-xl overflow-hidden border border-slate-700/50">
                      <RecordCard record={r} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-8">
                  Upload documents above to build your history.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
