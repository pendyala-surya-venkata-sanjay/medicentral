import { useState, useEffect } from 'react';
import { ArrowRight, Upload, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useQueue, transitionVisit, useOpsContext } from '../../hooks/useOpsContext';
import QueueMetricsBar from '../../components/ops/QueueMetricsBar';
import QueuePatientCard from '../../components/ops/QueuePatientCard';
import PatientSmartPanel from '../../components/ops/PatientSmartPanel';
import OpsShell from '../../components/enterprise/OpsShell';
import { useLivePulse } from '../../hooks/useLivePulse';

const PADashboard = () => {
  const { ctx } = useOpsContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const { patients, metrics, loading } = useQueue('PA', refreshKey, ctx);
  useLivePulse(refreshKey);
  const [selected, setSelected] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [prep, setPrep] = useState({ paPrepNotes: '', symptomNotes: '', vitals: { bp: '', pulse: '', spo2: '' } });
  const [file, setFile] = useState(null);

  const visitId = selected?.visit?._id;

  useEffect(() => {
    if (!visitId) {
      setDocuments([]);
      return;
    }
    api
      .get(`/ops/visit/${visitId}/patient-card`)
      .then(({ data }) => {
        setDocuments(data.documents || []);
        if (data.patient?.visit) {
          setPrep({
            paPrepNotes: data.patient.visit.paPrepNotes || '',
            symptomNotes: data.patient.visit.symptomNotes || '',
            vitals: data.patient.visit.vitals || { bp: '', pulse: '', spo2: '' },
          });
        }
      })
      .catch(() => setDocuments([]));
  }, [visitId, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const runAction = async (action) => {
    if (!visitId) return toast.error('Select a patient');
    try {
      await transitionVisit(visitId, action);
      toast.success('Workflow updated');
      refresh();
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const savePrep = async () => {
    if (!visitId) return;
    try {
      await api.patch(`/ops/visit/${visitId}/prep`, prep);
      toast.success('Preparation notes saved');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const uploadDoc = async () => {
    if (!visitId || !file) return toast.error('Select a file');
    const fd = new FormData();
    fd.append('document', file);
    fd.append('title', file.name);
    fd.append('category', 'other');
    try {
      await api.post(`/ops/visit/${visitId}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Report uploaded');
      setFile(null);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <OpsShell
      title="PA preparation"
      subtitle={`${ctx?.branch?.name || 'Branch'} · Upload · Forward to doctor`}
      icon={ClipboardList}
      role="doctor_pa"
      refreshKey={refreshKey}
    >
      <QueueMetricsBar
        metrics={metrics}
        queueType="PA"
        variant="ops"
        labels={{ waiting: 'Pending prep', emergency: 'Urgent', followUp: 'Follow-ups' }}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-2 max-h-[36rem] overflow-y-auto">
          <h3 className="font-bold text-slate-300">PA queue</h3>
          {loading ? (
            <div className="animate-pulse h-32 bg-slate-100 rounded-xl" />
          ) : (
            patients.map((p) => (
              <QueuePatientCard
                key={p.patientId + (p.visit?._id || '')}
                patient={p}
                selected={selected?.patientId === p.patientId}
                onSelect={setSelected}
                variant="ops"
              />
            ))
          )}
          {!loading && patients.length === 0 && (
            <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-xl">PA queue is clear.</p>
          )}
        </div>

        <div className="xl:col-span-2 space-y-4">
          <PatientSmartPanel patient={selected} documents={documents}>
            {visitId && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1 mb-1">
                    <ClipboardList className="w-3 h-3" /> Preparation notes
                  </label>
                  <textarea
                    rows={3}
                    value={prep.paPrepNotes}
                    onChange={(e) => setPrep({ ...prep, paPrepNotes: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Consultation prep, history summary…"
                  />
                </div>
                <textarea
                  rows={2}
                  value={prep.symptomNotes}
                  onChange={(e) => setPrep({ ...prep, symptomNotes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Symptom notes for doctor"
                />
                <div className="grid grid-cols-3 gap-2">
                  {['bp', 'pulse', 'spo2'].map((k) => (
                    <input
                      key={k}
                      placeholder={k.toUpperCase()}
                      value={prep.vitals[k] || ''}
                      onChange={(e) =>
                        setPrep({ ...prep, vitals: { ...prep.vitals, [k]: e.target.value } })
                      }
                      className="border rounded-lg px-2 py-1.5 text-sm"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={savePrep}
                  className="w-full border border-slate-300 py-2 rounded-lg text-sm font-semibold"
                >
                  Save preparation
                </button>

                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="text-sm flex-1"
                  />
                  <button
                    type="button"
                    onClick={uploadDoc}
                    className="shrink-0 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"
                  >
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">OCR scan — available in Phase 2</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => runAction('start_pa_review')}
                    className="bg-violet-600 text-white py-2.5 rounded-xl font-semibold text-sm"
                  >
                    Start preparation
                  </button>
                  <button
                    type="button"
                    onClick={() => runAction('forward_to_doctor')}
                    className="bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    Forward to doctor <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </PatientSmartPanel>
        </div>
      </div>
    </OpsShell>
  );
};

export default PADashboard;
