import { useState, useEffect } from 'react';
import { Activity, Scissors, BedDouble, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import api from '../../api/axios';

const widgetConfig = {
  doctor: ['emergencies', 'surgeries', 'billing'],
  ward_manager: ['emergencies', 'admissions', 'icu'],
  billing_staff: ['billing', 'emergencies'],
  receptionist: ['emergencies', 'admissions'],
  super_admin: ['emergencies', 'crossHospital', 'surgeries'],
  default: ['emergencies', 'billing'],
};

const LiveWidgets = ({ role = 'default', compact = false }) => {
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (role === 'super_admin') return;
    api
      .get('/intelligence/ops/insights')
      .then(({ data }) => setInsights(data))
      .catch(() => setInsights(null));
    const t = setInterval(() => {
      api.get('/intelligence/ops/insights').then(({ data }) => setInsights(data)).catch(() => {});
    }, 45000);
    return () => clearInterval(t);
  }, [role]);

  const keys = widgetConfig[role] || widgetConfig.default;

  const widgets = [
    {
      key: 'emergencies',
      show: keys.includes('emergencies'),
      icon: AlertTriangle,
      label: 'Emergency load',
      value: insights?.emergencies ?? '—',
      color: 'from-red-600/20 to-red-900/10 border-red-900/40 text-red-300',
    },
    {
      key: 'surgeries',
      show: keys.includes('surgeries'),
      icon: Scissors,
      label: 'Surgical pathway',
      value: insights?.surgeries ?? '—',
      color: 'from-purple-600/20 to-purple-900/10 border-purple-900/40 text-purple-300',
    },
    {
      key: 'admissions',
      show: keys.includes('admissions'),
      icon: BedDouble,
      label: 'Active visits',
      value: insights?.activeVisits ?? '—',
      color: 'from-teal-600/20 to-teal-900/10 border-teal-900/40 text-teal-300',
    },
    {
      key: 'billing',
      show: keys.includes('billing'),
      icon: Activity,
      label: 'Billing pending',
      value: insights?.billingPending ?? '—',
      color: 'from-amber-600/20 to-amber-900/10 border-amber-900/40 text-amber-300',
    },
    {
      key: 'icu',
      show: keys.includes('icu'),
      icon: BedDouble,
      label: 'ICU watch',
      value: 'Live',
      color: 'from-rose-600/20 to-rose-900/10 border-rose-900/40 text-rose-300',
    },
    {
      key: 'crossHospital',
      show: keys.includes('crossHospital'),
      icon: ArrowRightLeft,
      label: 'Interop traffic',
      value: 'Active',
      color: 'from-indigo-600/20 to-indigo-900/10 border-indigo-900/40 text-indigo-300',
    },
  ].filter((w) => w.show);

  if (!widgets.length) return null;

  return (
    <div
      className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'}`}
    >
      {widgets.map((w) => (
        <div
          key={w.key}
          className={`ops-glass rounded-xl p-3 border bg-gradient-to-br ${w.color} transition hover:scale-[1.02] touch-manipulation`}
        >
          <w.icon className="w-4 h-4 mb-2 opacity-80" />
          <p className="text-[10px] uppercase tracking-wide opacity-70">{w.label}</p>
          <p className="text-xl font-bold tabular-nums">{w.value}</p>
        </div>
      ))}
    </div>
  );
};

export default LiveWidgets;
