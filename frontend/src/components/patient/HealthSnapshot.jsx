import { motion } from 'framer-motion';
import { Pill, AlertTriangle, Calendar, Activity, Stethoscope } from 'lucide-react';
import { formatDateIN } from '../../utils/format';

const HealthSnapshot = ({ cockpit, stats }) => {
  const meds = stats?.ongoingMedications?.length
    ? stats.ongoingMedications
    : cockpit?.aiSummary?.stats?.activeMeds
      ? [cockpit.aiSummary.stats.activeMeds + ' active']
      : [];
  const allergies = stats?.allergies?.length ? stats.allergies : [];
  const followUps = stats?.followUps || [];

  const cards = [
    {
      icon: Pill,
      label: 'Active medications',
      value: meds.length ? meds.slice(0, 3).join(' · ') : 'None on file',
      color: 'text-violet-600',
    },
    {
      icon: AlertTriangle,
      label: 'Allergies',
      value: allergies.length ? allergies.join(', ') : 'None recorded',
      color: allergies.length ? 'text-red-600' : 'text-slate-500',
    },
    {
      icon: Calendar,
      label: 'Next follow-up',
      value: followUps[0] ? formatDateIN(followUps[0].date) : '—',
      color: 'text-cyan-600',
    },
    {
      icon: Stethoscope,
      label: 'Last consultation',
      value: cockpit?.lastConsultation?.diagnosis || '—',
      color: 'text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="patient-glass rounded-2xl p-5 flex gap-4"
        >
          <div className="p-3 rounded-xl bg-slate-100 shrink-0">
            <c.icon className={`w-5 h-5 ${c.color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{c.label}</p>
            <p className="text-sm font-semibold text-slate-800 mt-2 line-clamp-2">{c.value}</p>
          </div>
        </motion.div>
      ))}
      {stats?.healthScore != null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="patient-glass rounded-2xl p-4 sm:col-span-2 flex items-center gap-4"
        >
          <Activity className="w-8 h-8 text-cyan-600" />
          <div>
            <p className="text-xs text-slate-500 uppercase">Wellness snapshot</p>
            <p className="text-2xl font-bold text-slate-900">{stats.healthScore}/100</p>
            <p className="text-xs text-slate-600 mt-1">Based on your visits and profile completeness</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HealthSnapshot;
