import { motion } from 'framer-motion';
import { Activity, Building2, Globe2, Share2, Network } from 'lucide-react';

const nodes = [
  { x: '12%', y: '25%', label: 'Apollo HYD', code: 'APHYD' },
  { x: '72%', y: '20%', label: 'Yashoda BLR', code: 'YSBLR' },
  { x: '45%', y: '55%', label: 'Interop Hub', code: 'MCNET' },
  { x: '28%', y: '72%', label: 'Patient ID', code: 'GLOBAL' },
];

const EnterpriseLoginVisual = () => (
  <div className="relative h-full min-h-[320px] lg:min-h-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#060d24] via-[#0f2847] to-[#0c4a6e]">
    <div className="absolute inset-0 auth-mesh opacity-40" />
    <motion.div
      className="absolute w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl"
      animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
      transition={{ duration: 8, repeat: Infinity }}
      style={{ top: '10%', left: '20%' }}
    />
    <div className="relative z-10 p-8 xl:p-10 h-full flex flex-col">
      <div className="flex items-center gap-2 text-cyan-300/90 text-xs font-bold uppercase tracking-[0.2em]">
        <Globe2 className="w-4 h-4" />
        Global Healthcare Operating System
      </div>
      <h2 className="text-2xl xl:text-3xl font-bold text-white mt-4 leading-tight">
        One portal.
        <br />
        <span className="text-cyan-300">Every hospital.</span>
      </h2>
      <p className="text-slate-400 text-sm mt-3 max-w-sm leading-relaxed">
        Organization-based access · Live workflow queues · Consent-driven interoperability
      </p>

      <div className="relative flex-1 my-8 min-h-[180px]">
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <motion.line
            x1="20%"
            y1="30%"
            x2="50%"
            y2="55%"
            stroke="#22d3ee"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          />
          <motion.line
            x1="75%"
            y1="25%"
            x2="50%"
            y2="55%"
            stroke="#818cf8"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse' }}
          />
        </svg>
        {nodes.map((n, i) => (
          <motion.div
            key={n.code}
            className="absolute"
            style={{ left: n.x, top: n.y }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.15 }}
          >
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] text-cyan-300 font-mono">{n.code}</p>
              <p className="text-xs text-white font-medium">{n.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {[
          { icon: Activity, label: 'Live queues' },
          { icon: Share2, label: 'Interop' },
          { icon: Building2, label: 'Multi-tenant' },
          { icon: Network, label: 'Command Center' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-slate-300 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
            <Icon className="w-4 h-4 text-cyan-400" />
            {label}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default EnterpriseLoginVisual;
