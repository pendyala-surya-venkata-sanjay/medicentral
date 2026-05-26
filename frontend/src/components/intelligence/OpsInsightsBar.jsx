import { useState, useEffect } from 'react';
import { Lightbulb, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';

const OpsInsightsBar = () => {
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    api
      .get('/intelligence/ops/insights')
      .then(({ data }) => setInsights(data))
      .catch(() => setInsights(null));
    const t = setInterval(() => {
      api.get('/intelligence/ops/insights').then(({ data }) => setInsights(data)).catch(() => {});
    }, 60000);
    return () => clearInterval(t);
  }, []);

  if (!insights) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-900 text-white p-4 flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <Lightbulb className="w-5 h-5 text-amber-400" />
        <span className="text-xs font-bold uppercase tracking-wide text-slate-300">Ops intelligence</span>
      </div>
      <p className="text-sm text-slate-200 flex-1">{insights.narrative}</p>
      {insights.alerts?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {insights.alerts.slice(0, 3).map((a, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${
                a.severity === 'critical' ? 'bg-red-600' : 'bg-slate-700'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              {a.message?.slice(0, 40)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default OpsInsightsBar;
