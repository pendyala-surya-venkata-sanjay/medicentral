import { useState, useEffect } from 'react';
import { Brain, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';

const severityStyle = {
  critical: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-blue-100 bg-blue-50 text-blue-900',
};

const ClinicalAssistantPanel = ({ patientId, visitId }) => {
  const [panel, setPanel] = useState(null);

  useEffect(() => {
    if (!patientId) return;
    const params = visitId ? { visitId } : {};
    api
      .get(`/intelligence/patient/${patientId}/assistant`, { params })
      .then(({ data }) => setPanel(data))
      .catch(() => setPanel(null));
  }, [patientId, visitId]);

  if (!patientId || !panel) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-slate-700" />
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase">Clinical assistant</p>
          <p className="text-[10px] text-slate-400">Assist only — not a diagnosis</p>
        </div>
      </div>

      {panel.alerts?.length > 0 ? (
        <ul className="space-y-2">
          {panel.alerts.map((a, i) => (
            <li
              key={i}
              className={`text-sm px-3 py-2 rounded-lg border flex items-start gap-2 ${severityStyle[a.severity] || severityStyle.info}`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {a.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          No critical assist flags for current context
        </p>
      )}

      {panel.checklist && (
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(panel.checklist).map(([k, v]) =>
            v ? (
              <span key={k} className="bg-white border rounded px-2 py-0.5 text-slate-600">
                {k.replace(/([A-Z])/g, ' $1')}
              </span>
            ) : null
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicalAssistantPanel;
