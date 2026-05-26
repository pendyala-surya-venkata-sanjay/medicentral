import { useState } from 'react';
import { Pill, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useQueue, useOpsContext } from '../../hooks/useOpsContext';
import QueueMetricsBar from '../../components/ops/QueueMetricsBar';
import QueuePatientCard from '../../components/ops/QueuePatientCard';
import PatientSmartPanel from '../../components/ops/PatientSmartPanel';
import OpsShell from '../../components/enterprise/OpsShell';
import { useLivePulse } from '../../hooks/useLivePulse';

const PharmacyDashboard = () => {
  const { ctx } = useOpsContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const { patients, metrics, loading } = useQueue('PHARMACY', refreshKey, ctx);
  useLivePulse(refreshKey);
  const [selected, setSelected] = useState(null);
  const [pharmCtx, setPharmCtx] = useState(null);

  const visitId = selected?.visit?._id;

  const loadVisit = async (id) => {
    const { data } = await api.get(`/pharmacy-ops/visit/${id}`);
    setPharmCtx(data);
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  const selectPatient = async (p) => {
    setSelected(p);
    if (p?.visit?._id) await loadVisit(p.visit._id);
  };

  const loadRx = async () => {
    if (!visitId) return;
    try {
      await api.post(`/pharmacy-ops/visit/${visitId}/load-prescriptions`);
      toast.success('Loaded from prescriptions');
      await loadVisit(visitId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const runTransition = async (action) => {
    if (!visitId) return;
    try {
      await api.post(`/pharmacy-ops/visit/${visitId}/transition`, { action });
      toast.success(action === 'dispense_medicines' ? 'Dispensed' : 'Forwarded to billing');
      refresh();
      if (action === 'forward_to_billing') setSelected(null);
      else await loadVisit(visitId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const pending = pharmCtx?.pharmacy?.pending || [];
  const rx = pharmCtx?.pharmacy?.prescriptions || [];

  return (
    <OpsShell
      title="Pharmacy operations"
      subtitle="Prescription queue · No inventory ERP"
      icon={Pill}
      role="pharmacist"
      refreshKey={refreshKey}
    >
      <QueueMetricsBar metrics={metrics} queueType="PHARMACY" variant="ops" labels={{ waiting: 'Pending Rx', emergency: 'Urgent', followUp: 'Refills' }} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
          <h3 className="font-bold">Pharmacy queue</h3>
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
                {rx[0]?.medicines?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Doctor prescription</p>
                    <ul className="text-sm space-y-1">
                      {rx[0].medicines.map((m, i) => (
                        <li key={i} className="bg-white border rounded px-2 py-1">
                          {m.medicine} — {m.dosage} {m.frequency}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button type="button" onClick={loadRx} className="text-sm text-indigo-700 font-semibold underline">
                  Load prescriptions into queue
                </button>
                {pending.length > 0 && (
                  <ul className="text-sm space-y-1">
                    {pending.map((p, i) => (
                      <li key={i} className="bg-amber-50 border border-amber-100 rounded px-2 py-1">
                        {p.medicationName} · {p.dosage} · qty {p.quantity}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => runTransition('dispense_medicines')} className="bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Dispense
                  </button>
                  <button type="button" onClick={() => runTransition('forward_to_billing')} className="bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold">
                    → Billing
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

export default PharmacyDashboard;
