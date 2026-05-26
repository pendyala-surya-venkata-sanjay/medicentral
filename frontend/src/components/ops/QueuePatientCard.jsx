import { motion } from 'framer-motion';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';

const priorityStylesLight = {
  critical: 'border-red-300 bg-red-50/80 emergency-border-pulse',
  urgent: 'border-amber-300 bg-amber-50/80',
  normal: 'border-slate-100 bg-white',
};

const priorityStylesOps = {
  critical: 'border-red-500/60 bg-red-950/40 emergency-border-pulse',
  urgent: 'border-amber-500/50 bg-amber-950/30',
  normal: 'border-slate-700/80 bg-slate-900/60',
};

const QueuePatientCard = ({ patient, selected, onSelect, variant = 'light', index = 0 }) => {
  const v = patient.visit;
  const pri = v?.priority || 'normal';
  const ps = variant === 'ops' ? priorityStylesOps : priorityStylesLight;
  const textMain = variant === 'ops' ? 'text-slate-100' : 'text-slate-900';
  const textId = variant === 'ops' ? 'text-cyan-400' : 'text-blue-600';
  const textMuted = variant === 'ops' ? 'text-slate-500' : 'text-slate-500';

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onSelect?.(patient)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all touch-manipulation min-w-[260px] md:min-w-0 snap-center ${
        ps[pri] || ps.normal
      } ${selected ? 'ring-2 ring-cyan-500 border-cyan-400 scale-[1.01]' : variant === 'ops' ? 'hover:border-cyan-700' : 'hover:border-blue-200'}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <p className={`font-bold truncate ${textMain}`}>{patient.name}</p>
          <p className={`text-xs font-mono mt-0.5 ${textId}`}>{patient.patientId}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
      </div>
      <div className="flex flex-wrap gap-2 mt-2 text-xs">
        {v?.isPrebooked && (
          <span
            className={`px-2 py-0.5 rounded font-semibold ${
              variant === 'ops' ? 'bg-violet-500/30 text-violet-200' : 'bg-violet-100 text-violet-800'
            }`}
          >
            VIP pre-book
          </span>
        )}
        {v?.tokenNumber && (
          <span
            className={`px-2 py-0.5 rounded font-semibold ${
              variant === 'ops' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-800'
            }`}
          >
            Token {v.tokenNumber}
          </span>
        )}
        {pri !== 'normal' && (
          <span className="flex items-center gap-1 text-red-700 font-semibold capitalize">
            <AlertTriangle className="w-3 h-3" /> {pri}
          </span>
        )}
        {v?.waitMinutes != null && (
          <span className={`flex items-center gap-1 ${textMuted}`}>
            <Clock className="w-3 h-3" /> {v.waitMinutes}m wait
          </span>
        )}
        {v?.workflowState && variant === 'ops' && (
          <span className="text-[10px] bg-slate-800 text-cyan-300/90 px-1.5 py-0.5 rounded font-mono">
            {v.workflowState.replace(/_/g, ' ')}
          </span>
        )}
        {v?.department && <span className={textMuted}>{v.department}</span>}
      </div>
      {patient.allergies?.length > 0 && (
        <p className="text-xs text-red-400 mt-2 truncate">Allergies: {patient.allergies.join(', ')}</p>
      )}
      {patient.vitals?.bp && (
        <p className={`text-xs mt-1 ${variant === 'ops' ? 'text-slate-400' : 'text-slate-600'}`}>
          Vitals: BP {patient.vitals.bp}
          {patient.vitals.pulse ? ` · Pulse ${patient.vitals.pulse}` : ''}
        </p>
      )}
      <p className={`text-[10px] mt-2 ${variant === 'ops' ? 'text-slate-600' : 'text-slate-400'}`}>
        {patient.visitCount} visits · {patient.documentCount} files
      </p>
    </motion.button>
  );
};

export default QueuePatientCard;
