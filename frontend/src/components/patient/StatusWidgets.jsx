import { motion } from 'framer-motion';
import { FileSearch, HeartPulse, Sparkles, Pill } from 'lucide-react';

const StatusWidgets = ({ cockpit }) => {
  const treatment = cockpit?.activeTreatment;
  const alertCount = cockpit?.prescriptionAlerts?.length || 0;

  const widgets = [
    {
      icon: HeartPulse,
      title: treatment ? 'Active treatment' : 'No active visit',
      subtitle: treatment
        ? `${treatment.hospital} · ${treatment.department}${treatment.tokenNumber ? ` · Token ${treatment.tokenNumber}` : ''}`
        : 'Use VIP pre-book on this dashboard when ready',
      accent: treatment ? 'border-cyan-200 bg-cyan-50' : 'border-slate-200',
    },
    {
      icon: FileSearch,
      title: 'Pending reports',
      subtitle:
        cockpit?.pendingReports > 0
          ? `${cockpit.pendingReports} lab report(s) in progress`
          : 'All caught up',
      accent: cockpit?.pendingReports > 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200',
    },
    {
      icon: Pill,
      title: alertCount > 0 ? `${alertCount} medicine reminder${alertCount > 1 ? 's' : ''}` : 'Prescription reminders',
      subtitle:
        alertCount > 0
          ? cockpit.prescriptionAlerts
              .slice(0, 2)
              .map((a) => `${a.medicine} (${a.daysRemaining}d left)`)
              .join(' · ')
          : 'Alerts appear when your doctor prescribes medicines with duration',
      accent: alertCount > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200',
    },
  ];

  if (treatment?.isPrebooked) {
    widgets.unshift({
      icon: Sparkles,
      title: 'VIP pre-booked',
      subtitle: 'Priority check-in at reception',
      accent: 'border-violet-200 bg-violet-50',
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {widgets.slice(0, 3).map((w, i) => (
        <motion.div
          key={w.title}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ y: -2 }}
          className={`patient-glass rounded-2xl p-5 border ${w.accent} transition-shadow hover:shadow-md`}
        >
          <w.icon className="w-5 h-5 text-blue-600 mb-3" />
          <p className="font-semibold text-sm text-slate-900">{w.title}</p>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-2">{w.subtitle}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatusWidgets;
