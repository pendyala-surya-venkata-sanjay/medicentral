import { motion } from 'framer-motion';

const NetworkVisualization = ({ graph, tenants = [] }) => {
  const nodes = graph?.nodes?.length
    ? graph.nodes
    : tenants.map((t, i) => ({
        id: t.tenant?.slug || i,
        label: t.tenant?.name,
        x: 100 + (i % 4) * 140,
        y: 60 + Math.floor(i / 4) * 100,
        activeVisits: t.metrics?.activeVisits || 0,
        emergencies: t.metrics?.emergencies || 0,
      }));

  const links = graph?.links || [];

  const width = 560;
  const height = 280;

  return (
    <div className="ops-glass rounded-2xl border border-slate-800/80 p-4 overflow-hidden">
      <h2 className="font-bold text-white mb-1">Network ecosystem</h2>
      <p className="text-xs text-slate-500 mb-4">Hospital connectivity · interoperability pulse</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {links.map((l, i) => {
          const a = nodes.find((n) => n.id === l.source);
          const b = nodes.find((n) => n.id === l.target);
          if (!a || !b) return null;
          return (
            <motion.line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="url(#linkGrad)"
              strokeWidth={Math.min(4, l.weight || 1)}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: i * 0.05, duration: 0.8 }}
            />
          );
        })}
        {nodes.map((n, i) => (
          <g key={n.id}>
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={12 + Math.min(8, n.activeVisits || 0)}
              fill={n.emergencies > 0 ? 'rgba(239,68,68,0.35)' : 'rgba(34,211,238,0.25)'}
              stroke={n.emergencies > 0 ? '#f87171' : '#22d3ee'}
              strokeWidth={2}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            />
            <text x={n.x} y={n.y + 28} textAnchor="middle" fill="#94a3b8" fontSize="10">
              {n.label?.split(' ')[0]}
            </text>
            <text x={n.x} y={n.y + 40} textAnchor="middle" fill="#64748b" fontSize="8">
              {n.activeVisits} active
            </text>
          </g>
        ))}
      </svg>
      {graph?.pulse > 0 && (
        <p className="text-center text-xs text-cyan-400/80 mt-2">
          Network pulse: {graph.pulse} active visits system-wide
        </p>
      )}
    </div>
  );
};

export default NetworkVisualization;
