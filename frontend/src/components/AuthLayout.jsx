import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HeartPulse,
  Shield,
  FileText,
  BrainCircuit,
  Users,
  CheckCircle2,
} from 'lucide-react';

const highlights = [
  { icon: Shield, text: 'Trusted Healthcare Platform' },
  { icon: FileText, text: 'Secure Patient Records' },
  { icon: BrainCircuit, text: 'AI-assisted Medical Insights' },
];

const AuthLayout = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row auth-page-bg">
      <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative overflow-hidden healthcare-auth-panel">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1e4a] via-[#0f3460] to-[#0ea5e9]/30" />
        <div className="absolute inset-0 auth-mesh opacity-60" />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 text-white w-full">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 group">
              <HeartPulse className="h-9 w-9 text-cyan-300 group-hover:scale-105 transition-transform" />
              <span className="text-2xl font-bold tracking-tight">
                Medi<span className="text-cyan-300">Central</span>
              </span>
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-16 max-w-md"
            >
              <p className="text-cyan-200/90 text-sm font-semibold uppercase tracking-widest mb-3">
                Patient-first care
              </p>
              <h1 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
                Your health journey, beautifully organized
              </h1>
              <p className="text-slate-300 leading-relaxed text-sm xl:text-base">
                Centralize prescriptions, lab reports, and visit history in one secure place.
                Share with your doctor when you need care — on your terms.
              </p>
            </motion.div>
          </div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="space-y-4 my-10"
          >
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-slate-200">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur border border-white/20">
                  <Icon className="h-5 w-5 text-cyan-300" />
                </span>
                <span className="font-medium">{text}</span>
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-card-dark rounded-2xl p-5 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-cyan-400" />
              <span className="text-sm font-semibold">Built for families & hospitals</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              End-to-end encryption mindset, role-based access, and audit-friendly workflows for
              modern Indian healthcare.
            </p>
          </motion.div>
        </div>
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-cyan-400/20 blur-3xl"
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <HeartPulse className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-800">
              Medi<span className="text-blue-600">Central</span>
            </span>
          </div>

          <div className="auth-glass-card rounded-3xl p-8 sm:p-10 shadow-2xl">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{title}</h2>
              {subtitle && <p className="text-slate-500 mt-2 text-sm">{subtitle}</p>}
            </div>
            {children}
          </div>
          {footer}
        </motion.div>
      </div>
    </div>
  );
};

export const AuthTrustBadge = () => (
  <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
    Your data is protected with secure access controls
  </p>
);

export default AuthLayout;
