import { useEffect, useState } from 'react';
import { LayoutDashboard, BedDouble, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import OpsShell from '../../components/enterprise/OpsShell';
import { useOpsContext } from '../../hooks/useOpsContext';
import { workflowStateLabel } from '../../utils/visitLabels';

const StaffOverviewDashboard = () => {
  const { ctx } = useOpsContext();
  const [doctors, setDoctors] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [prebooks, setPrebooks] = useState([]);
  const [wardCount, setWardCount] = useState(0);

  useEffect(() => {
    api.get('/ops/hospital/doctors').then(({ data }) => setDoctors(Array.isArray(data) ? data : [])).catch(() => {});
    api.get('/ops/follow-up/patients').then(({ data }) => setFollowUps(Array.isArray(data) ? data : [])).catch(() => {});
    api.get('/ops/prebooks/pending').then(({ data }) => setPrebooks(Array.isArray(data) ? data : [])).catch(() => {});
    api
      .get('/ops/ward/admitted')
      .then(({ data }) => setWardCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setWardCount(0));
  }, []);

  return (
    <OpsShell
      title="Staff overview"
      subtitle="Hospital-scoped view · Patients are global · Your team and queues"
      icon={LayoutDashboard}
      role="receptionist"
      showWidgets={false}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="ops-card">
          <p className="text-xs text-slate-500 uppercase font-semibold">Your hospital</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{ctx?.tenant?.name || '—'}</p>
          <p className="text-sm text-slate-600">{ctx?.branch?.name || ctx?.branch?.city}</p>
        </div>
        <div className="ops-card">
          <p className="text-xs text-slate-500 uppercase font-semibold">Doctors on duty</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{doctors.length}</p>
        </div>
        <div className="ops-card">
          <p className="text-xs text-slate-500 uppercase font-semibold">Pre-booked today</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{prebooks.length}</p>
        </div>
        <Link to="/ops/ward-attendance" className="ops-card hover:border-blue-300 transition group">
          <p className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5" /> Ward attendance
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1 group-hover:text-blue-700">{wardCount}</p>
          <p className="text-xs text-blue-600 mt-1">View admitted patients →</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="ops-card">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" /> Doctors at this branch
          </h3>
          {doctors.length === 0 ? (
            <p className="text-sm text-slate-500">No doctors registered for this hospital yet.</p>
          ) : (
            <ul className="space-y-2">
              {doctors.map((d) => (
                <li key={d.doctorId} className="flex justify-between text-sm border-b border-slate-100 py-2">
                  <span className="font-medium text-slate-800">{d.name}</span>
                  <span className="text-slate-500">{d.specialization}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="ops-card">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" /> After doctor visit (follow-up / billing)
          </h3>
          {followUps.length === 0 ? (
            <p className="text-sm text-slate-500">No patients awaiting staff follow-up or billing.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {followUps.slice(0, 8).map((p) => (
                <li key={p.patientId + (p.visit?._id || '')} className="text-sm py-2 border-b border-slate-100">
                  <span className="font-medium text-slate-800">{p.name}</span>
                  <span className="font-mono text-blue-700 text-xs ml-2">{p.patientId}</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {workflowStateLabel(p.visit?.workflowState)}
                    {p.visit?.followUpRequired ? ' · Follow-up' : ''}
                    {p.visit?.dischargeRequested ? ' · Discharge' : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {followUps.length > 0 && (
            <Link to="/ops/follow-up" className="inline-block text-sm text-blue-600 font-medium mt-3">
              Open follow-up desk →
            </Link>
          )}
        </div>
      </div>
    </OpsShell>
  );
};

export default StaffOverviewDashboard;
