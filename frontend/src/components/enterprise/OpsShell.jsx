import { useOpsContext } from '../../hooks/useOpsContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useLivePulse } from '../../hooks/useLivePulse';
import LiveIndicator from './LiveIndicator';
import NotificationCenter from './NotificationCenter';
import LiveWidgets from './LiveWidgets';
import MobileOpsNav from './MobileOpsNav';

const accentMap = {
  doctor: 'from-blue-600 via-blue-500 to-cyan-600',
  doctor_pa: 'from-violet-600 via-indigo-500 to-blue-600',
  receptionist: 'from-cyan-600 via-blue-500 to-teal-600',
  ward_manager: 'from-teal-600 via-cyan-500 to-blue-600',
  lab_supervisor: 'from-orange-500 via-amber-500 to-yellow-500',
  billing_staff: 'from-emerald-600 via-teal-500 to-cyan-600',
  pharmacist: 'from-indigo-600 via-blue-500 to-violet-600',
  surgery_head: 'from-purple-600 via-violet-500 to-indigo-600',
  printer_filing_officer: 'from-slate-600 via-slate-500 to-slate-700',
  default: 'from-blue-600 via-indigo-500 to-cyan-600',
};

const OpsShell = ({
  title,
  subtitle,
  icon: Icon,
  role,
  children,
  refreshKey = 0,
  showWidgets = true,
  headerExtra,
}) => {
  const { ctx, operationalRole } = useOpsContext();
  const notif = useNotifications(ctx);
  const pulsing = useLivePulse(refreshKey);
  const opRole = role || operationalRole || 'default';
  const gradient = accentMap[opRole] || accentMap.default;

  return (
    <div className="ops-theme min-h-full -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-5 sm:space-y-6">
        <header
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} text-white p-5 sm:p-6 shadow-lg border border-white/20`}
        >
          <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <LiveIndicator active />
                {pulsing && (
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    Queue updated
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 tracking-tight">
                {Icon && <Icon className="w-7 h-7 shrink-0 text-cyan-400" />}
                {title}
              </h1>
              <p className="text-blue-50/90 text-sm mt-1">{subtitle}</p>
              {ctx?.branch?.name && (
                <p className="text-xs text-blue-100/90 mt-1">
                  {ctx.tenant?.name} · {ctx.branch.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {headerExtra}
              <NotificationCenter {...notif} />
            </div>
          </div>
        </header>

        {showWidgets && <LiveWidgets role={opRole} />}

        <div className="pb-20 lg:pb-0">{children}</div>
      </div>
      <MobileOpsNav role={opRole} />
    </div>
  );
};

export default OpsShell;
