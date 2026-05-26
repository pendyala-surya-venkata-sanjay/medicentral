import { useState } from 'react';
import { FlaskConical, Upload, CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useQueue, useOpsContext } from '../../hooks/useOpsContext';
import QueueMetricsBar from '../../components/ops/QueueMetricsBar';
import QueuePatientCard from '../../components/ops/QueuePatientCard';
import PatientSmartPanel from '../../components/ops/PatientSmartPanel';
import OpsShell from '../../components/enterprise/OpsShell';
import { useLivePulse } from '../../hooks/useLivePulse';

const LabDashboard = () => {
  const { ctx } = useOpsContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const { patients, metrics, loading } = useQueue('LAB', refreshKey, ctx);
  useLivePulse(refreshKey);
  const [selected, setSelected] = useState(null);
  const [labCtx, setLabCtx] = useState(null);
  const [findings, setFindings] = useState('');
  const [testName, setTestName] = useState('');
  const [file, setFile] = useState(null);

  const visitId = selected?.visit?._id;

  const loadVisit = async (id) => {
    const { data } = await api.get(`/lab-ops/visit/${id}`);
    setLabCtx(data);
    setFindings('');
    setTestName(data.lab?.orders?.[0]?.testName || '');
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  const selectPatient = async (p) => {
    setSelected(p);
    if (p?.visit?._id) await loadVisit(p.visit._id);
  };

  const runTransition = async (action) => {
    if (!visitId) return;
    try {
      await api.post(`/lab-ops/visit/${visitId}/transition`, { action, notes: findings });
      toast.success('Lab workflow updated');
      refresh();
      if (action === 'complete_lab') setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const uploadReport = async () => {
    if (!visitId || !file) return toast.error('Select file');
    const fd = new FormData();
    fd.append('document', file);
    fd.append('testName', testName || file.name);
    fd.append('findings', findings);
    fd.append('category', 'pathology');
    try {
      await api.post(`/lab-ops/visit/${visitId}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Report uploaded');
      setFile(null);
      await loadVisit(visitId);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <OpsShell
      title="Lab operations"
      subtitle={`${ctx?.branch?.name || 'Branch'} · Live queue · Auto-forward to billing`}
      icon={FlaskConical}
      role="lab_supervisor"
      refreshKey={refreshKey}
    >
      <QueueMetricsBar metrics={metrics} queueType="LAB" variant="ops" labels={{ waiting: 'Pending tests', emergency: 'Urgent', followUp: 'Follow-ups' }} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
          <h3 className="font-bold text-slate-300">Lab queue</h3>
          {loading ? (
            <div className="animate-pulse h-32 bg-slate-100 rounded-xl" />
          ) : (
            patients.map((p) => (
              <QueuePatientCard
                key={p.patientId + (p.visit?._id || '')}
                patient={p}
                selected={selected?.patientId === p.patientId}
                onSelect={selectPatient}
                variant="ops"
              />
            ))
          )}
        </div>

        <div className="xl:col-span-2">
          <PatientSmartPanel patient={selected} documents={labCtx?.lab?.reports || []}>
            {visitId && (
              <div className="space-y-4">
                {labCtx?.lab?.orders?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Ordered tests</p>
                    <ul className="text-sm space-y-1">
                      {labCtx.lab.orders.map((o, i) => (
                        <li key={i} className="bg-white px-2 py-1 rounded border">
                          <span className="font-semibold">{o.testName}</span>
                          <span className="text-slate-500 ml-2 capitalize">({o.category})</span>
                          {o.instructions && <p className="text-xs text-slate-500">{o.instructions}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {labCtx?.visit?.labInstructions && (
                  <p className="text-sm bg-amber-50 p-2 rounded border border-amber-100">
                    <strong>Doctor instructions:</strong> {labCtx.visit.labInstructions}
                  </p>
                )}
                <input
                  placeholder="Test name for upload"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <textarea
                  rows={2}
                  placeholder="Findings / results"
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex gap-2 items-center">
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="text-sm flex-1" />
                  <button type="button" onClick={uploadReport} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1">
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button type="button" onClick={() => runTransition('start_lab')} className="bg-orange-600 text-white py-2 rounded-xl text-sm font-semibold">
                    Start lab
                  </button>
                  <button type="button" onClick={() => runTransition('complete_lab')} className="bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Complete → Billing
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

export default LabDashboard;
