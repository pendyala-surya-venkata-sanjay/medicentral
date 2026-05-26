const LiveIndicator = ({ active = true, label = 'Live' }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${
      active ? 'text-emerald-400' : 'text-slate-500'
    }`}
  >
    <span
      className={`relative flex h-2 w-2 ${active ? 'animate-pulse-live' : ''}`}
    >
      {active && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
      )}
      <span
        className={`relative inline-flex rounded-full h-2 w-2 ${active ? 'bg-emerald-500' : 'bg-slate-500'}`}
      />
    </span>
    {label}
  </span>
);

export default LiveIndicator;
