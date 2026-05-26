import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Users, Bed, AlertTriangle, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatINR } from '../utils/format';

const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'insurance', label: 'Insurance' },
];

const HospitalDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [bills, setBills] = useState([]);
  const [billForm, setBillForm] = useState({
    patientId: '',
    description: '',
    amount: '',
    category: 'consultation',
    gstRate: '0',
  });
  const [payMethod, setPayMethod] = useState('upi');

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        api.get('/hospital-ops/analytics'),
        api.get('/billing'),
      ]);
      setAnalytics(a.data);
      setBills(Array.isArray(b.data) ? b.data : []);
    } catch {
      toast.error('Failed to load revenue data');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createBill = async (e) => {
    e.preventDefault();
    try {
      await api.post('/billing', billForm);
      toast.success('Invoice created');
      setBillForm({
        patientId: '',
        description: '',
        amount: '',
        category: 'consultation',
        gstRate: '0',
      });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bill');
    }
  };

  const markPaid = async (billId, balance) => {
    try {
      await api.put(`/billing/${billId}/payment`, { amount: balance, method: payMethod });
      toast.success('Payment recorded');
      load();
    } catch {
      toast.error('Payment failed');
    }
  };

  const chartDaily = analytics?.dailyPatients?.length ? analytics.dailyPatients : [{ day: '—', patients: 0 }];
  const chartDept = analytics?.departmentLoad?.map((d) => ({ name: d._id || '—', count: d.count })) || [];

  if (!analytics) {
    return <div className="animate-pulse h-64 bg-slate-200 rounded-2xl" />;
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <p className="text-xs uppercase tracking-widest text-blue-200 font-bold mb-1">Revenue & billing</p>
        <h1 className="text-2xl font-bold mb-1">Hospital financial overview</h1>
        <p className="text-slate-200 text-sm">Revenue collected · Pending bills · Department load</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Registered patients', value: analytics.totalPatients ?? 0, icon: Users, color: 'text-blue-500' },
          { label: 'Ward admissions (active)', value: analytics.activeAdmissions ?? 0, icon: Bed, color: 'text-emerald-500' },
          { label: "Today's visits", value: analytics.todayVisits ?? 0, icon: Users, color: 'text-purple-500' },
          { label: 'Emergency queue', value: analytics.emergencyVisits ?? 0, icon: AlertTriangle, color: 'text-red-500' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm"
          >
            <s.icon className={`w-6 h-6 ${s.color} mb-2`} />
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Daily visit footfall (7 days)</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartDaily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-2">Revenue collected</h3>
          <p className="text-3xl font-bold text-emerald-600 flex items-center gap-2">
            <IndianRupee className="w-7 h-7" />
            {formatINR(analytics.totalRevenue || 0)}
          </p>
          <p className="text-sm text-slate-500 mt-1">{analytics.pendingBills ?? 0} pending bills</p>
          <div className="h-36 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDept.length ? chartDept : [{ name: '—', count: 0 }]}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={createBill} className="bg-white p-6 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
          <h3 className="font-bold flex items-center gap-2 text-slate-900">
            <IndianRupee className="w-4 h-4" /> Create bill (GST)
          </h3>
          <input
            required
            placeholder="Patient ID (MC-PT-xxxx)"
            value={billForm.patientId}
            onChange={(e) => setBillForm({ ...billForm, patientId: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={billForm.category}
            onChange={(e) => setBillForm({ ...billForm, category: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="consultation">Consultation fee</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="lab">Lab / diagnostics</option>
            <option value="surgery">Surgery charges</option>
            <option value="room">Room / ward</option>
            <option value="other">Other</option>
          </select>
          <input
            required
            placeholder="Description"
            value={billForm.description}
            onChange={(e) => setBillForm({ ...billForm, description: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              type="number"
              placeholder="Amount (₹)"
              value={billForm.amount}
              onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="GST %"
              value={billForm.gstRate}
              onChange={(e) => setBillForm({ ...billForm, gstRate: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Generate invoice
          </button>
        </form>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b flex flex-wrap justify-between items-center gap-2">
            <h3 className="font-bold text-slate-900">Billing & payments</h3>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {bills.slice(0, 20).map((b) => (
              <div key={b._id} className="p-3 text-sm flex justify-between items-center gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{formatINR(b.totalAmount)}</p>
                  <p className="text-slate-500 text-xs">
                    {b.invoiceNumber || 'Invoice'} · {b.status}
                  </p>
                </div>
                {b.status !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => markPaid(b._id, b.totalAmount - (b.amountPaid || 0))}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded-lg shrink-0"
                  >
                    Mark paid
                  </button>
                )}
              </div>
            ))}
            {bills.length === 0 && <p className="p-4 text-slate-500 text-sm">No bills yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
