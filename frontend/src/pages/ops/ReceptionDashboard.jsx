import { useEffect, useState } from 'react';
import { UserPlus, ArrowRight, Zap, ClipboardList, Users, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useQueue } from '../../hooks/useOpsContext';
import { useOpsContext } from '../../hooks/useOpsContext';
import OpsShell from '../../components/enterprise/OpsShell';
import { useLivePulse } from '../../hooks/useLivePulse';
import QueuePatientCard from '../../components/ops/QueuePatientCard';
import PatientSmartPanel from '../../components/ops/PatientSmartPanel';
import OpsPatientIdBar from '../../components/ops/OpsPatientIdBar';
import { VISIT_TYPE_OPTIONS } from '../../utils/visitLabels';

const ReceptionDashboard = () => {
  const { ctx } = useOpsContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const { patients, loading } = useQueue('RECEPTION', refreshKey, ctx);
  useLivePulse(refreshKey);
  const [selected, setSelected] = useState(null);
  const [staged, setStaged] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [doctorQueue, setDoctorQueue] = useState([]);
  const [quick, setQuick] = useState({
    name: '',
    phone: '',
    department: 'General Medicine',
    visitType: 'OP',
    priority: 'normal',
    patientId: '',
    symptomNotes: '',
  });
  const [vitals, setVitals] = useState({
    bp: '',
    pulse: '',
    temperature: '',
    spo2: '',
  });

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    api
      .get('/ops/hospital/doctors')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setDoctors(list);
        if (!doctorId && list[0]?.doctorId) setDoctorId(list[0].doctorId);
      })
      .catch(() => setDoctors([]));
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) return;
    api
      .get(`/ops/doctor/queue?doctorId=${encodeURIComponent(doctorId)}`)
      .then(({ data }) => setDoctorQueue(Array.isArray(data?.patients) ? data.patients : []))
      .catch(() => setDoctorQueue([]));
  }, [doctorId, refreshKey]);

  const createVisit = async (opts = {}) => {
    try {
      const payload = {
        ...quick,
        vitals,
        forwardToDoctor: true,
        forwardToPa: false,
        ...opts,
      };
      const { data } = await api.post('/ops/reception/quick-visit', payload);
      toast.success(`Registered — Token ${data.visit?.tokenNumber || '—'} · sent to doctor queue`);
      setQuick({
        name: '',
        phone: '',
        department: 'General Medicine',
        visitType: 'OP',
        priority: 'normal',
        patientId: '',
        symptomNotes: '',
      });
      setVitals({ bp: '', pulse: '', temperature: '', spo2: '' });
      refresh();
      return data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      return null;
    }
  };

  const handleLookup = (data) => {
    if (!data?.patient) {
      setSelected(null);
      return;
    }
    // True reception staging: count rises only after Load patient.
    setStaged((prev) => {
      const exists = prev.some((p) => p.patientId === data.patient.patientId);
      if (exists) return prev;
      return [...prev, data.patient];
    });
    setSelected(data.patient);
    toast.success(`Added to reception staging (${data.patient.patientId})`);
  };

  const useStagedPatient = (p) => {
    setSelected(p);
    setQuick((q) => ({
      ...q,
      patientId: p.patientId || '',
      name: p.name || '',
      phone: p.contactNumber || '',
      symptomNotes: q.symptomNotes,
    }));
  };

  const forwardStagedToDoctor = async (p) => {
    setQuick((q) => ({
      ...q,
      patientId: p.patientId || '',
      name: p.name || '',
      phone: p.contactNumber || '',
    }));
    const res = await createVisit();
    if (res?.visit?._id) {
      // Count drops only when forwarded.
      setStaged((prev) => prev.filter((x) => x.patientId !== p.patientId));
      if (selected?.patientId === p.patientId) setSelected(null);
    }
  };

  return (
    <OpsShell
      title="Reception desk"
      subtitle={`${ctx?.tenant?.name || 'Hospital'} · Register patient · Record vitals · Doctor queue`}
      icon={ClipboardList}
      role="receptionist"
      refreshKey={refreshKey}
      showWidgets={false}
    >
      <OpsPatientIdBar onResolved={handleLookup} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="ops-card flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Reception staging</p>
            <p className="text-2xl font-bold text-slate-900">{staged.length}</p>
          </div>
        </div>
        <div className="ops-card flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-cyan-700" />
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Reception queue</p>
            <p className="text-2xl font-bold text-slate-900">{patients.length}</p>
          </div>
        </div>
        <div className="ops-card flex items-center gap-3">
          <Stethoscope className="w-6 h-6 text-violet-700" />
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Selected doctor queue</p>
            <p className="text-2xl font-bold text-slate-900">{doctorQueue.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <div className="ops-card">
            <h3 className="font-bold text-slate-900 mb-3">View doctor queue</h3>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="ops-input"
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.doctorId} value={d.doctorId}>
                  {d.name} · {d.specialization}
                </option>
              ))}
            </select>
            <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
              {doctorQueue.map((p) => (
                <div key={p.patientId + (p.visit?._id || '')} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="font-mono text-xs text-blue-700">{p.patientId}</p>
                </div>
              ))}
              {doctorId && doctorQueue.length === 0 && (
                <p className="text-sm text-slate-500">No patients in this doctor queue.</p>
              )}
            </div>
          </div>

          <div className="ops-card">
            <h3 className="font-bold text-slate-900 mb-3">Reception staging list</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {staged.map((p) => (
                <div key={p.patientId} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="font-mono text-xs text-blue-700">{p.patientId}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => useStagedPatient(p)}
                      className="text-sm py-2 rounded-lg border border-slate-300 text-slate-800"
                    >
                      Fill form
                    </button>
                    <button
                      type="button"
                      onClick={() => forwardStagedToDoctor(p)}
                      className="text-sm py-2 rounded-lg bg-blue-600 text-white font-semibold"
                    >
                      Forward
                    </button>
                  </div>
                </div>
              ))}
              {staged.length === 0 && (
                <p className="text-sm text-slate-500">Use Load patient to add entries here.</p>
              )}
            </div>
          </div>

          <div className="ops-card space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" /> Register patient visit
            </h3>
            <div>
              <label className="ops-label">Patient ID (existing global patient)</label>
              <input
                value={quick.patientId}
                onChange={(e) => setQuick({ ...quick, patientId: e.target.value })}
                className="ops-input font-mono"
                placeholder="MC-PT-…"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="ops-label">Name (new patient)</label>
                <input
                  value={quick.name}
                  onChange={(e) => setQuick({ ...quick, name: e.target.value })}
                  className="ops-input"
                />
              </div>
              <div>
                <label className="ops-label">Mobile</label>
                <input
                  value={quick.phone}
                  onChange={(e) => setQuick({ ...quick, phone: e.target.value })}
                  className="ops-input"
                />
              </div>
            </div>
            <div>
              <label className="ops-label">Department</label>
              <select
                value={quick.department}
                onChange={(e) => setQuick({ ...quick, department: e.target.value })}
                className="ops-input"
              >
                {['General Medicine', 'Cardiology', 'Emergency', 'Pediatrics', 'Orthopedics'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="ops-label">Visit type</label>
                <select
                  value={quick.visitType}
                  onChange={(e) => setQuick({ ...quick, visitType: e.target.value })}
                  className="ops-input"
                >
                  {VISIT_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ops-label">Priority</label>
                <select
                  value={quick.priority}
                  onChange={(e) => setQuick({ ...quick, priority: e.target.value })}
                  className="ops-input"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Emergency</option>
                </select>
              </div>
            </div>
            <div>
              <label className="ops-label">Symptoms / reason</label>
              <textarea
                rows={2}
                value={quick.symptomNotes}
                onChange={(e) => setQuick({ ...quick, symptomNotes: e.target.value })}
                className="ops-input"
              />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase">Vitals at registration</p>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Blood pressure" value={vitals.bp} onChange={(e) => setVitals({ ...vitals, bp: e.target.value })} className="ops-input" />
              <input placeholder="Pulse" value={vitals.pulse} onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })} className="ops-input" />
              <input placeholder="Temperature" value={vitals.temperature} onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })} className="ops-input" />
              <input placeholder="SpO₂" value={vitals.spo2} onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })} className="ops-input" />
            </div>
            <button
              type="button"
              onClick={() => createVisit()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              Register directly & send to doctor queue <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => createVisit({ priority: 'critical' })}
              className="w-full border border-red-300 text-red-800 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm bg-red-50"
            >
              <Zap className="w-4 h-4" /> Emergency priority
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-slate-900 mb-3">Reception queue</h3>
            {loading ? (
              <div className="animate-pulse h-40 bg-slate-100 rounded-xl" />
            ) : (
              <div className="space-y-2 max-h-[32rem] overflow-y-auto">
                {patients.map((p) => (
                  <QueuePatientCard
                    key={p.patientId + (p.visit?._id || '')}
                    patient={p}
                    selected={selected?.patientId === p.patientId}
                    onSelect={setSelected}
                  />
                ))}
                {patients.length === 0 && (
                  <p className="text-sm text-slate-600 p-4 bg-white border border-slate-200 rounded-xl">
                    No patients waiting at reception.
                  </p>
                )}
              </div>
            )}
          </div>
          <PatientSmartPanel patient={selected} />
        </div>
      </div>
    </OpsShell>
  );
};

export default ReceptionDashboard;
