import { motion } from 'framer-motion';
import AnimatedCounter from '../patient/AnimatedCounter';

const AnimatedMetricCard = ({ label, value, icon: Icon, accent = 'cyan', delay = 0 }) => {
  const accents = {
    cyan: 'from-cyan-500/20 to-slate-900 border-cyan-500/30 text-cyan-400',
    red: 'from-red-500/20 to-slate-900 border-red-500/30 text-red-400',
    violet: 'from-violet-500/20 to-slate-900 border-violet-500/30 text-violet-400',
    emerald: 'from-emerald-500/20 to-slate-900 border-emerald-500/30 text-emerald-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
      className={`ops-glass rounded-2xl p-5 border bg-gradient-to-br ${accents[accent] || accents.cyan}`}
    >
      {Icon && <Icon className={`w-7 h-7 mb-3 ${accents[accent]?.split(' ').pop()}`} />}
      <p className="text-3xl font-bold text-white tabular-nums">
        {typeof value === 'number' ? <AnimatedCounter value={value} /> : value ?? '—'}
      </p>
      <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{label}</p>
    </motion.div>
  );
};

export default AnimatedMetricCard;
