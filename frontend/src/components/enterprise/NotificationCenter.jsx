import { Bell, X, CheckCheck, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const severityIcon = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const NotificationCenter = ({
  unread,
  open,
  setOpen,
  items,
  loading,
  markRead,
  markAllRead,
  severityForType,
}) => (
  <>
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="relative p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 hover:bg-slate-700 transition touch-manipulation"
      aria-label="Notifications"
    >
      <Bell className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse-live">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>

    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white">Operations</h2>
                <p className="text-xs text-slate-400">{unread} unread</p>
              </div>
              <div className="flex gap-2">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs text-cyan-400 flex items-center gap-1 hover:text-cyan-300"
                  >
                    <CheckCheck className="w-4 h-4" /> Mark all
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading && <p className="text-slate-500 text-sm p-4">Loading…</p>}
              {!loading && items.length === 0 && (
                <p className="text-slate-500 text-sm p-8 text-center">No notifications yet</p>
              )}
              {items.map((n) => {
                const sev = severityForType(n.type);
                const Icon = severityIcon[sev] || Info;
                return (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => !n.read && markRead(n._id)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      n.read
                        ? 'border-slate-800 bg-slate-900/40 opacity-70'
                        : 'border-slate-700 bg-slate-900/80 hover:border-cyan-800'
                    } ${sev === 'critical' ? 'emergency-border-pulse' : ''}`}
                  >
                    <div className="flex gap-2">
                      <Icon
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          sev === 'critical' ? 'text-red-400' : sev === 'warning' ? 'text-amber-400' : 'text-cyan-400'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-white">{n.title}</p>
                        {n.message && <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>}
                        <p className="text-[10px] text-slate-600 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  </>
);

export default NotificationCenter;
