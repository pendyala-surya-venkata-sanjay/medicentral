import { useState } from 'react';
import { FileCheck, Printer, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useQueue, useOpsContext } from '../../hooks/useOpsContext';
import QueuePatientCard from '../../components/ops/QueuePatientCard';
import PatientSmartPanel from '../../components/ops/PatientSmartPanel';
import OpsShell from '../../components/enterprise/OpsShell';
import { useLivePulse } from '../../hooks/useLivePulse';

const DischargeDashboard = () => {
  const { ctx } = useOpsContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const { patients, metrics, loading } = useQueue('PRINTING', refreshKey, ctx);
  useLivePulse(refreshKey);
  const [selected, setSelected] = useState(null);
  const [dischargeCtx, setDischargeCtx] = useState(null);
  const [printable, setPrintable] = useState('');

  const visitId = selected?.visit?._id;

  const loadVisit = async (id) => {
    const { data } = await api.get(`/discharge-ops/visit/${id}`);
    setDischargeCtx(data);
    setPrintable(data.discharge?.summary || '');
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  const selectPatient = async (p) => {
    setSelected(p);
    if (p?.visit?._id) await loadVisit(p.visit._id);
  };

  const generateSummary = async () => {
    if (!visitId) return;
    try {
      const { data } = await api.post(`/discharge-ops/visit/${visitId}/generate-summary`);
      setPrintable(data.printable || data.discharge?.summary || '');
      toast.success('Discharge summary ready');
      await loadVisit(visitId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const runDischarge = async () => {
    if (!visitId) return;
    try {
      await api.post(`/discharge-ops/visit/${visitId}/transition`, { action: 'discharge' });
      toast.success('Patient digitally discharged');
      refresh();
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const downloadText = () => {
    const blob = new Blob([printable], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discharge-${selected?.patientId || 'patient'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <OpsShell
      title="Discharge operations"
      subtitle="Summary · Printable packet · Archive workflow"
      icon={FileCheck}
      role="printer_filing_officer"
      refreshKey={refreshKey}
    >
      {/* Keep discharge desk clean: no extra counters. */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
          <h3 className="font-bold">Discharge queue</h3>
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
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={generateSummary} className="bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1">
                    <FileCheck className="w-4 h-4" /> Generate summary
                  </button>
                  {printable && (
                    <button type="button" onClick={downloadText} className="border border-slate-300 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1">
                      <Printer className="w-4 h-4" /> Download packet
                    </button>
                  )}
                  <button type="button" onClick={runDischarge} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1">
                    <LogOut className="w-4 h-4" /> Digital discharge
                  </button>
                </div>
                {printable && (
                  <pre className="text-xs bg-slate-50 border rounded-xl p-4 max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {printable}
                  </pre>
                )}
              </div>
            )}
          </PatientSmartPanel>
        </div>
      </div>
    </OpsShell>
  );
};

export default DischargeDashboard;
