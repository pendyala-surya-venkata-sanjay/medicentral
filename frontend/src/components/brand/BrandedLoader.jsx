import { Activity } from 'lucide-react';

const BrandedLoader = ({ label = 'Loading MediCentral…', compact = false }) => (
  <div
    className={`flex flex-col items-center justify-center gap-4 ${compact ? 'py-8' : 'min-h-[40vh]'}`}
    role="status"
    aria-live="polite"
  >
    <div className="relative">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
        <Activity className="w-7 h-7 text-white animate-pulse" />
      </div>
      <span className="absolute -inset-1 rounded-2xl border-2 border-indigo-400/40 animate-ping opacity-40" />
    </div>
    <p className="text-sm font-medium text-slate-600 tracking-wide">{label}</p>
  </div>
);

export default BrandedLoader;
