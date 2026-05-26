import { Users, AlertTriangle, Clock } from 'lucide-react';

const QueueMetricsBar = ({ metrics, queueType, labels = {}, variant = 'light' }) => {
  const m = metrics?.[queueType] || { total: 0, emergencies: 0, followUps: 0 };
  const items = [
    { label: labels.waiting || 'Waiting', value: m.total, icon: Users, color: 'text-cyan-400' },
    { label: labels.emergency || 'Emergency', value: m.emergencies, icon: AlertTriangle, color: 'text-red-400', pulse: m.emergencies > 0 },
    { label: labels.followUp || 'Follow-ups', value: m.followUps, icon: Clock, color: 'text-amber-400' },
  ];

  const card =
    variant === 'ops'
      ? 'ops-glass rounded-xl border border-slate-800/80 p-3 sm:p-4 flex items-center gap-3'
      : 'bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm';

  const valueCls = variant === 'ops' ? 'text-2xl font-bold text-white tabular-nums' : 'text-2xl font-bold text-slate-800';
  const labelCls = variant === 'ops' ? 'text-xs text-slate-500 font-medium' : 'text-xs text-slate-500 font-medium';

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {items.map((item) => (
        <div key={item.label} className={`${card} ${item.pulse ? 'emergency-border-pulse' : ''}`}>
          <item.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${item.color} shrink-0`} />
          <div className="min-w-0">
            <p className={valueCls}>{item.value}</p>
            <p className={labelCls}>{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QueueMetricsBar;
