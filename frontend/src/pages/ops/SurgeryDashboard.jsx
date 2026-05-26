import { useState } from 'react';
import { Scissors, Upload, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useQueue, useOpsContext } from '../../hooks/useOpsContext';
import QueueMetricsBar from '../../components/ops/QueueMetricsBar';
import QueuePatientCard from '../../components/ops/QueuePatientCard';
import PatientSmartPanel from '../../components/ops/PatientSmartPanel';
import OpsShell from '../../components/enterprise/OpsShell';
import { useLivePulse } from '../../hooks/useLivePulse';

const SurgeryDashboard = () => {
  const { ctx } = useOpsContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const { patients, metrics, loading } = useQueue('SURGERY', refreshKey, ctx);
  useLivePulse(refreshKey);
  const [selected, setSelected] = useState(null);
  const [surgCtx, setSurgCtx] = useState(null);
  const [procedureName, setProcedureName] = useState('');
  const [otRoom, setOtRoom] = useState('OT-1');
  const [surgeonName, setSurgeonName] = useState('');
  const [preOpNotes, setPreOpNotes] = useState('');
  const [postOpNotes, setPostOpNotes] = useState('');
  const [files, setFiles] = useState([]);

  const visitId = selected?.visit?._id;
  const state = selected?.visit?.workflowState;

  const loadVisit = async (id) => {
    const { data } = await api.get(`/surgery-ops/visit/${id}`);
    setSurgCtx(data);
    const s = data.surgery?.surgery || {};
    setProcedureName(s.procedureName || '');
    setOtRoom(s.otRoom || 'OT-1');
    setSurgeonName(s.surgeonName || '');
    setPreOpNotes(s.preOpNotes || '');
    setPostOpNotes(s.postOpNotes || '');
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  const selectPatient = async (p) => {
    setSelected(p);
    if (p?.visit?._id) await loadVisit(p.visit._id);
  };

  const savePlan = async () => {
    if (!visitId) return;
    try {
      await api.patch(`/surgery-ops/visit/${visitId}/plan`, {
        procedureName,
        otRoom,
        surgeonName,
        preOpNotes,
        postOpNotes,
      });
      toast.success('Surgery plan saved');
      await loadVisit(visitId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const runTransition = async (action) => {
    if (!visitId) return;
    try {
      await api.post(`/surgery-ops/visit/${visitId}/transition`, {
        action,
        meta: { procedureName, otRoom, surgeonName, preOpNotes, postOpNotes },
      });
      toast.success('Surgery workflow updated');
      refresh();
      if (action === 'complete_surgery') setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const uploadMedia = async () => {
    if (!visitId || !files.length) return toast.error('Select images');
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    fd.append('title', procedureName || 'Surgery');
    try {
      await api.post(`/surgery-ops/visit/${visitId}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Surgery media uploaded');
      setFiles([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <OpsShell
      title="Surgery operations"
      subtitle="Schedule · OT · Post-op — workflow only"
      icon={Scissors}
      role="surgery_head"
      refreshKey={refreshKey}
    >
      <QueueMetricsBar metrics={metrics} queueType="SURGERY" variant="ops" labels={{ waiting: 'Pending OT', emergency: 'Emergency', followUp: 'Scheduled' }} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
          <h3 className="font-bold">Surgery queue</h3>
          {loading ? (
            <div className="animate-pulse h-32 bg-slate-100 rounded-xl" />
          ) : (
            patients.map((p) => (
              <QueuePatientCard
                key={p.patientId + (p.visit?._id || '')}
                patient={p}
                selected={selected?.patientId === p.patientId}
                onSelect={selectPatient}
              />
            ))
          )}
        </div>

        <div className="xl:col-span-2">
          <PatientSmartPanel patient={selected}>
            {visitId && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase">OT status: {state}</p>
                <input placeholder="Procedure" value={procedureName} onChange={(e) => setProcedureName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="OT room" value={otRoom} onChange={(e) => setOtRoom(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Surgeon" value={surgeonName} onChange={(e) => setSurgeonName(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                </div>
                <textarea rows={2} placeholder="Pre-op instructions" value={preOpNotes} onChange={(e) => setPreOpNotes(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <textarea rows={2} placeholder="Post-op notes" value={postOpNotes} onChange={(e) => setPostOpNotes(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <button type="button" onClick={savePlan} className="bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                  Save plan
                </button>
                <div className="flex gap-2 items-center">
                  <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} className="text-sm flex-1" />
                  <button type="button" onClick={uploadMedia} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1">
                    <Upload className="w-4 h-4" /> Media
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {state === 'SURGERY_REQUIRED' && (
                    <button type="button" onClick={() => runTransition('schedule_surgery')} className="bg-purple-600 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                      <Calendar className="w-4 h-4" /> Schedule
                    </button>
                  )}
                  {state === 'SURGERY_SCHEDULED' && (
                    <button type="button" onClick={() => runTransition('start_surgery')} className="bg-violet-600 text-white py-2 rounded-xl text-sm font-semibold">
                      Start surgery
                    </button>
                  )}
                  {state === 'IN_SURGERY' && (
                    <button type="button" onClick={() => runTransition('complete_surgery')} className="bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold">
                      Complete
                    </button>
                  )}
                  {state === 'POST_SURGERY' && (
                    <button type="button" onClick={() => runTransition('forward_pharmacy')} className="bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold">
                      → Pharmacy
                    </button>
                  )}
                </div>
                {surgCtx?.surgery?.vitals && (
                  <p className="text-xs bg-slate-50 p-2 rounded border">
                    Vitals: BP {surgCtx.surgery.vitals.bp || '—'} · SpO₂ {surgCtx.surgery.vitals.spo2 || '—'}
                  </p>
                )}
              </div>
            )}
          </PatientSmartPanel>
        </div>
      </div>
    </OpsShell>
  );
};

export default SurgeryDashboard;
