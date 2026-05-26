import { Inbox } from 'lucide-react';

const EmptyState = ({
  title = 'Nothing here yet',
  description = 'Data will appear when this workflow is active.',
  icon: Icon = Inbox,
  action = null,
  dark = false,
}) => (
  <div
    className={`rounded-2xl border border-dashed p-8 text-center ${
      dark
        ? 'border-slate-700 bg-slate-900/40 text-slate-400'
        : 'border-slate-200 bg-slate-50/80 text-slate-500'
    }`}
  >
    <Icon className={`w-10 h-10 mx-auto mb-3 ${dark ? 'text-indigo-400' : 'text-indigo-500'}`} />
    <h3 className={`font-semibold ${dark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
    <p className="text-sm mt-2 max-w-md mx-auto leading-relaxed">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
