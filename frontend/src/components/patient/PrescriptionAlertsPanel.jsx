import { motion } from 'framer-motion';
import { Pill, Clock, Stethoscope } from 'lucide-react';
import { formatDateIN } from '../../utils/format';

const PrescriptionAlertsPanel = ({ alerts = [] }) => {
  if (!alerts.length) {
    return (
      <div className="patient-glass rounded-2xl p-6 border border-emerald-100 bg-emerald-50/40">
        <div className="flex items-center gap-3">
          <Pill className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="font-semibold text-slate-900 text-sm">Prescription reminders</p>
            <p className="text-xs text-slate-600 mt-1">No active medicine courses right now.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-glass rounded-2xl p-6 sm:p-8 border border-emerald-200">
      <div className="flex items-center gap-2 mb-5">
        <Pill className="w-5 h-5 text-emerald-600" />
        <h3 className="font-bold text-slate-900">Prescription reminders</h3>
        <span className="ml-auto text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
          {alerts.length} active
        </span>
      </div>
      <div className="space-y-3">
        {alerts.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm"
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="font-semibold text-slate-900">{a.medicine}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {[a.dosage, a.frequency, a.timing].filter(Boolean).join(' · ') || 'As prescribed'}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg ${
                  a.daysRemaining <= 1
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {a.daysRemaining === 0 ? 'Last day' : `${a.daysRemaining}d left`}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Until {formatDateIN(a.endsAt)}
              </span>
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3 h-3" />
                Dr. {a.doctorName}
              </span>
            </div>
            {a.instructions && (
              <p className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2">{a.instructions}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PrescriptionAlertsPanel;
