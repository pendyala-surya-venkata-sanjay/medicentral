import { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, Pill, Activity } from 'lucide-react';
import api from '../../api/axios';

const AIPatientSummaryCard = ({ patientId, visitId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    const params = visitId ? { visitId } : {};
    api
      .get(`/intelligence/patient/${patientId}/summary`, { params })
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [patientId, visitId]);

  if (!patientId || loading) {
    return (
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 animate-pulse h-24" />
    );
  }
  if (!data) return null;

  return (
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Clinical summary</p>
          <p className="text-sm text-slate-700 leading-relaxed mt-1">{data.narrative}</p>
          <p className="text-[10px] text-slate-400 mt-2">{data.disclaimer}</p>
        </div>
      </div>
      {data.riskIndicators?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.riskIndicators.slice(0, 4).map((r, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-1 rounded-lg font-medium flex items-center gap-1 ${
                r.severity === 'critical'
                  ? 'bg-red-100 text-red-800'
                  : r.severity === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              {r.message}
            </span>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-white rounded-lg p-2 border">
          <Pill className="w-3 h-3 text-emerald-600 mb-1" />
          <p className="font-semibold">{data.cards?.medications?.length || 0} meds</p>
        </div>
        <div className="bg-white rounded-lg p-2 border">
          <AlertTriangle className="w-3 h-3 text-amber-600 mb-1" />
          <p className="font-semibold">{data.cards?.allergies?.length || 0} allergies</p>
        </div>
        <div className="bg-white rounded-lg p-2 border">
          <Activity className="w-3 h-3 text-rose-600 mb-1" />
          <p className="font-semibold">{data.stats?.totalVisits || 0} visits</p>
        </div>
        <div className="bg-white rounded-lg p-2 border">
          <p className="text-slate-500">Hospitals</p>
          <p className="font-semibold">{data.stats?.hospitals || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default AIPatientSummaryCard;
