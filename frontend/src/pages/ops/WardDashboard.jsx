import { useState } from 'react';
import { Building2, Activity, BedDouble, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useQueue, useOpsContext } from '../../hooks/useOpsContext';
import QueueMetricsBar from '../../components/ops/QueueMetricsBar';
import QueuePatientCard from '../../components/ops/QueuePatientCard';
import PatientSmartPanel from '../../components/ops/PatientSmartPanel';
import OpsShell from '../../components/enterprise/OpsShell';
import { useLivePulse } from '../../hooks/useLivePulse';

const WardDashboard = () => {
  const { ctx } = useOpsContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const { patients, metrics, loading } = useQueue('WARD', refreshKey, ctx);
  useLivePulse(refreshKey);
  const [selected, setSelected] = useState(null);
  const [wardCtx, setWardCtx] = useState(null);
  const [wardName, setWardName] = useState('Cardiology Ward');
  const [bedNumber, setBedNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [icu, setIcu] = useState(false);
  const [nursingText, setNursingText] = useState('');
  const [vitals, setVitals] = useState({ bp: '', pulse: '', spo2: '', temperature: '', glucose: '', respiratoryRate: '' });

  const visitId = selected?.visit?._id;

  const loadVisit = async (id) => {
    const { data } = await api.get(`/ward-ops/visit/${id}`);
    setWardCtx(data);
    const ip = data.ward?.inpatient || {};
    setWardName(ip.wardName || 'Cardiology Ward');
    setBedNumber(ip.bedNumber || '');
    setRoomNumber(ip.roomNumber || '');
    setIcu(!!ip.icu);
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  const selectPatient = async (p) => {
    setSelected(p);
    if (p?.visit?._id) await loadVisit(p.visit._id);
  };

  const runTransition = async (action) => {
    if (!visitId) return;
    try {
      await api.post(`/ward-ops/visit/${visitId}/transition`, {
        action,
        meta: { inpatient: { wardName, bedNumber, roomNumber, icu } },
      });
      toast.success('Ward workflow updated');
      refresh();
      await loadVisit(visitId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const saveAllocation = async () => {
    if (!visitId) return;
    try {
      await api.patch(`/ward-ops/visit/${visitId}/admission`, { wardName, bedNumber, roomNumber, icu });
      toast.success('Bed allocated');
      await loadVisit(visitId);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const saveVitals = async () => {
    if (!visitId) return;
    try {
      await api.post(`/ward-ops/visit/${visitId}/vitals`, { vitals });
      toast.success('Vitals recorded');
      await loadVisit(visitId);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const addNote = async () => {
    if (!visitId || !nursingText.trim()) return;
    try {
      await api.post(`/ward-ops/visit/${visitId}/nursing-note`, { text: nursingText });
      setNursingText('');
      toast.success('Nursing note saved');
      await loadVisit(visitId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const state = selected?.visit?.workflowState;

  return (
    <OpsShell
      title="Ward operations"
      subtitle={`${ctx?.branch?.name || 'Branch'} · Admissions · Vitals · Nursing`}
      icon={BedDouble}
      role="ward_manager"
      refreshKey={refreshKey}
    >
      <QueueMetricsBar metrics={metrics} queueType="WARD" variant="ops" labels={{ waiting: 'In ward queue', emergency: 'ICU / urgent', followUp: 'Observations' }} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
          <h3 className="font-bold">Admission queue</h3>
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
          <PatientSmartPanel patient={selected} documents={[]}>
            {visitId && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase">Status: {state}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <input placeholder="Ward" value={wardName} onChange={(e) => setWardName(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Bed" value={bedNumber} onChange={(e) => setBedNumber(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Room" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={icu} onChange={(e) => setIcu(e.target.checked)} /> ICU transfer
                </label>
                <button type="button" onClick={saveAllocation} className="bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1">
                  <BedDouble className="w-4 h-4" /> Allocate bed
                </button>

                <div className="border-t pt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                    <Activity className="w-4 h-4" /> Live vitals
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['bp', 'pulse', 'spo2', 'temperature', 'glucose', 'respiratoryRate'].map((k) => (
                      <input
                        key={k}
                        placeholder={k}
                        value={vitals[k]}
                        onChange={(e) => setVitals((v) => ({ ...v, [k]: e.target.value }))}
                        className="border rounded-lg px-2 py-1.5 text-sm"
                      />
                    ))}
                  </div>
                  <button type="button" onClick={saveVitals} className="mt-2 bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                    Record vitals
                  </button>
                  {wardCtx?.ward?.vitalsLog?.length > 0 && (
                    <ul className="mt-2 text-xs text-slate-600 space-y-1">
                      {wardCtx.ward.vitalsLog.slice(0, 3).map((v, i) => (
                        <li key={i}>
                          {v.bp && `BP ${v.bp}`} {v.pulse && `· Pulse ${v.pulse}`} {v.recordedAt && `· ${new Date(v.recordedAt).toLocaleString()}`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <textarea rows={2} placeholder="Nursing note" value={nursingText} onChange={(e) => setNursingText(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <button type="button" onClick={addNote} className="border border-slate-300 px-4 py-2 rounded-xl text-sm font-semibold">
                  Add nursing note
                </button>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {state === 'ADMISSION_REQUIRED' && (
                    <>
                      <button type="button" onClick={() => runTransition('admit_patient')} className="bg-teal-600 text-white py-2 rounded-xl text-sm font-semibold">
                        Admit
                      </button>
                      <button type="button" onClick={() => runTransition('emergency_admit')} className="bg-red-600 text-white py-2 rounded-xl text-sm font-semibold">
                        Emergency admit
                      </button>
                    </>
                  )}
                  {state === 'ADMITTED' && (
                    <button type="button" onClick={() => runTransition('start_observation')} className="bg-cyan-600 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                      <Stethoscope className="w-4 h-4" /> Under observation
                    </button>
                  )}
                  {state === 'UNDER_OBSERVATION' && (
                    <>
                      <button type="button" onClick={() => runTransition('request_surgery')} className="bg-purple-600 text-white py-2 rounded-xl text-sm font-semibold">
                        Surgery
                      </button>
                      <button type="button" onClick={() => runTransition('forward_pharmacy')} className="bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold">
                        Pharmacy
                      </button>
                    </>
                  )}
                  {state === 'POST_SURGERY' && (
                    <button type="button" onClick={() => runTransition('return_observation')} className="bg-cyan-600 text-white py-2 rounded-xl text-sm font-semibold">
                      Return to ward
                    </button>
                  )}
                </div>
              </div>
            )}
          </PatientSmartPanel>
        </div>
      </div>
    </OpsShell>
  );
};

export default WardDashboard;
