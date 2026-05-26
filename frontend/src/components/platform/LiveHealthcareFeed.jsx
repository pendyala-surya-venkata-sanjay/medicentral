import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';

const LiveHealthcareFeed = ({ feed = [] }) => (
  <div className="ops-glass rounded-2xl border border-slate-800/80 overflow-hidden">
    <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
      <Radio className="w-4 h-4 text-red-400 animate-pulse" />
      <h2 className="font-bold text-white">Live healthcare feed</h2>
    </div>
    <div className="max-h-[28rem] overflow-y-auto divide-y divide-slate-800/80">
      {feed.length === 0 ? (
        <p className="p-6 text-sm text-slate-500 text-center">No network activity yet.</p>
      ) : (
        feed.map((item, i) => (
          <motion.div
            key={`${item.at}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="p-4 hover:bg-slate-800/30 transition"
          >
            <p className="font-semibold text-slate-100 text-sm">{item.title}</p>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{item.summary}</p>
            <p className="text-slate-600 text-[10px] mt-2 font-mono">
              {new Date(item.at).toLocaleString()}
            </p>
          </motion.div>
        ))
      )}
    </div>
  </div>
);

export default LiveHealthcareFeed;
