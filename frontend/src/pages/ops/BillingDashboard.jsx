import { useMemo, useState, useEffect } from 'react';
import { IndianRupee, CheckCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useQueue, useOpsContext } from '../../hooks/useOpsContext';
import { formatINR } from '../../utils/format';
import OpsShell from '../../components/enterprise/OpsShell';
import { useLivePulse } from '../../hooks/useLivePulse';

const CATEGORY_LABELS = {
  consultation: 'Consultation',
  lab: 'Diagnostics',
  pharmacy: 'Pharmacy',
  room: 'Room / bed',
  procedure: 'Procedures',
  surgery: 'Surgery',
  other: 'Other',
};

const EMPTY_EDITOR = {
  consultation: 0,
  lab: 0,
  pharmacy: 0,
  room: 0,
  procedure: 0,
  surgery: 0,
  other: 0,
  notes: '',
};

const BillingDashboard = () => {
  const { ctx } = useOpsContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const { patients, loading } = useQueue('BILLING', refreshKey, ctx);
  useLivePulse(refreshKey);
  const [selected, setSelected] = useState(null);
  const [billCtx, setBillCtx] = useState(null);
  const [payMethod, setPayMethod] = useState('upi');
  const [editor, setEditor] = useState(EMPTY_EDITOR);

  const visitId = selected?.visit?._id;

  useEffect(() => {
    if (!visitId) return;
    api.get(`/billing-ops/visit/${visitId}`).then(({ data }) => setBillCtx(data)).catch(() => {});
  }, [visitId, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const selectPatient = (p) => {
    setSelected(p);
    if (p.bill) setBillCtx({ bill: p.bill, patient: p });
  };

  const saveBillSections = async () => {
    const bill = billCtx?.bill;
    if (!bill?._id) return;
    try {
      const items = Object.entries(CATEGORY_LABELS)
        .map(([key, label]) => ({
          description: label,
          category: key,
          amount: Number(editor[key] || 0),
        }))
        .filter((i) => i.amount > 0);

      const { data } = await api.put(`/billing/${bill._id}`, {
        items,
        notes: editor.notes,
        gstRate: 0,
      });

      setBillCtx((prev) => ({ ...prev, bill: data }));
      toast.success('Billing sections saved');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bill');
    }
  };

  const payAndMoveToDischarge = async () => {
    if (!visitId) return;
    try {
      await api.post(`/billing-ops/visit/${visitId}/transition`, {
        action: 'payment_completed',
        paymentMethod: payMethod,
      });
      await api.post(`/billing-ops/visit/${visitId}/transition`, {
        action: 'ready_discharge',
      });
      toast.success('Payment recorded and moved to ready-for-discharge');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const bill = billCtx?.bill;
  const items = bill?.items || [];

  useEffect(() => {
    if (!bill) {
      setEditor(EMPTY_EDITOR);
      return;
    }
    const byCategory = { ...EMPTY_EDITOR, notes: bill.notes || '' };
    items.forEach((item) => {
      const cat = item.category || 'other';
      byCategory[cat] = Number(byCategory[cat] || 0) + Number(item.amount || 0);
    });
    setEditor(byCategory);
  }, [bill?._id]);

  const computedTotal = useMemo(
    () =>
      Object.keys(CATEGORY_LABELS).reduce(
        (sum, key) => sum + Number(editor[key] || 0),
        0
      ),
    [editor]
  );

  return (
    <OpsShell
      title="Billing desk"
      subtitle="Single sectioned bill editor · Payment · Move to discharge"
      icon={IndianRupee}
      role="billing_staff"
      refreshKey={refreshKey}
      showWidgets={false}
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
          {loading ? (
            <div className="animate-pulse h-32 bg-slate-100 rounded-xl" />
          ) : (
            patients.map((p) => (
              <button
                key={p.patientId + (p.visit?._id || '')}
                type="button"
                onClick={() => {
                  setSelected(p);
                  if (p.visit?._id) {
                    api.get(`/billing-ops/visit/${p.visit._id}`).then(({ data }) => setBillCtx(data));
                  }
                }}
                className={`w-full text-left p-4 rounded-xl border-2 ${selected?.patientId === p.patientId ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white'}`}
              >
                <p className="font-bold">{p.name}</p>
                <p className="text-xs font-mono text-emerald-700">{p.patientId}</p>
                <p className="text-sm font-semibold mt-1">{p.visit?.workflowState}</p>
              </button>
            ))
          )}
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl border p-6 shadow-sm">
          {selected && bill ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{selected.name}</h2>
                  <p className="font-mono text-emerald-700">{selected.patientId}</p>
                  <p className="text-sm text-slate-500">{bill.invoiceNumber}</p>
                </div>
                <p className="text-3xl font-bold text-emerald-700">{formatINR(computedTotal)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <div key={key}>
                    <label className="ops-label">{label}</label>
                    <input
                      type="number"
                      min="0"
                      value={editor[key]}
                      onChange={(e) =>
                        setEditor((prev) => ({ ...prev, [key]: Number(e.target.value || 0) }))
                      }
                      className="ops-input"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="ops-label">Billing notes</label>
                <textarea
                  rows={2}
                  value={editor.notes}
                  onChange={(e) => setEditor((prev) => ({ ...prev, notes: e.target.value }))}
                  className="ops-input"
                />
              </div>

              <button
                type="button"
                onClick={saveBillSections}
                className="w-full sm:w-auto bg-slate-900 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save bill sections
              </button>

              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="ops-input max-w-xs"
              >
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="insurance">Insurance</option>
              </select>

              <button
                type="button"
                onClick={payAndMoveToDischarge}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> Confirm payment and move to discharge
              </button>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Select a patient from the billing queue</p>
          )}
        </div>
      </div>
    </OpsShell>
  );
};

export default BillingDashboard;
