import { useEffect, useState } from 'react';
import { Activity, Database, Radio, Server, Upload } from 'lucide-react';
import api from '../../api/axios';

const statusColor = (ok) => (ok ? 'text-emerald-400' : 'text-amber-400');

const LaunchHealthPanel = () => {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/platform/system-health');
        setHealth(data);
      } catch {
        setHealth(null);
      }
    };
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  if (!health) return null;

  const checks = health.checks || {};
  const ecosystem = health.ecosystemHealth || 'unknown';

  return (
    <section className="ops-glass rounded-2xl border border-slate-800/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Launch health</p>
          <p className="text-white font-semibold mt-1 capitalize">
            Ecosystem: <span className={statusColor(ecosystem === 'operational')}>{ecosystem}</span>
          </p>
        </div>
        {health.launchReady && (
          <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
            Launch ready
          </span>
        )}
        {health.presentationMode && (
          <span className="text-xs bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full border border-violet-500/30">
            Presentation mode
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
          <Database className="w-4 h-4 text-indigo-400 mb-1" />
          <p className="text-slate-500">Database</p>
          <p className={statusColor(checks.database?.ok)}>
            {checks.database?.ok ? `${checks.database.latencyMs}ms` : 'degraded'}
          </p>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
          <Radio className="w-4 h-4 text-cyan-400 mb-1" />
          <p className="text-slate-500">WebSocket</p>
          <p className="text-white">{checks.websocket?.connected ?? 0} clients</p>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
          <Activity className="w-4 h-4 text-amber-400 mb-1" />
          <p className="text-slate-500">Queues</p>
          <p className="text-white">{checks.queues?.pendingItems ?? 0} pending</p>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
          <Server className="w-4 h-4 text-violet-400 mb-1" />
          <p className="text-slate-500">Workflows</p>
          <p className="text-white">{checks.workflows?.activeVisits ?? 0} active</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Upload className="w-3 h-3" />
          Storage: {checks.uploads?.storage?.provider || 'local'}
        </span>
        <span>Uptime: {health.uptimeSec}s</span>
        <span>v{health.version}</span>
      </div>
    </section>
  );
};

export default LaunchHealthPanel;
