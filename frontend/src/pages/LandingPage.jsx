import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  Map,
  FileText,
  BrainCircuit,
  HeartPulse,
  ChevronRight,
  Shield,
  Hospital,
  Users,
  Clock,
  Star,
  Lock,
  Stethoscope,
  LineChart,
} from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';

const trustFeatures = [
  {
    icon: Shield,
    title: 'Secure healthcare records',
    desc: 'Your medical history stays private with role-based access — only you and your care team see what matters.',
  },
  {
    icon: BrainCircuit,
    title: 'AI-assisted insights',
    desc: 'Educational symptom guidance and structured summaries to help you prepare for informed conversations with doctors.',
  },
  {
    icon: Hospital,
    title: 'Hospital management',
    desc: 'OPD tokens, admissions, billing in INR, and operational dashboards built for Indian hospital workflows.',
  },
  {
    icon: Activity,
    title: 'Real-time patient tracking',
    desc: 'Follow-ups, lab results, prescriptions, and your complete treatment timeline in one calm, readable view.',
  },
];

const stats = [
  { value: '10K+', label: 'Records managed securely' },
  { value: '99.9%', label: 'Platform reliability' },
  { value: '24/7', label: 'Access your health anytime' },
];

const testimonials = [
  {
    quote:
      'Finally I can show my doctor all my old lab reports without carrying folders. MediCentral feels calm and trustworthy.',
    name: 'Priya S.',
    role: 'Patient, Bengaluru',
  },
  {
    quote:
      'Patient uploads before the visit save us 15 minutes every OPD. The timeline is exactly what we needed.',
    name: 'Dr. Rajesh K.',
    role: 'Consultant Physician',
  },
];

const workflowSteps = [
  { step: '1', title: 'Register & verify', desc: 'Create your patient profile with a unique MediCentral ID.' },
  { step: '2', title: 'Upload past records', desc: 'Add prescriptions, scans, and discharge summaries you already have.' },
  { step: '3', title: 'Visit & treat', desc: 'Doctors access your full history during OPD, IPD, and follow-ups.' },
  { step: '4', title: 'Track wellness', desc: 'Reminders, bills, labs, and AI guidance — all in one place.' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <HeartPulse className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-800 tracking-tight">
              Medi<span className="text-blue-600">Central</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/login"
              className="text-slate-600 font-medium hover:text-blue-600 transition text-sm sm:text-base"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-2.5 rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition text-sm sm:text-base"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 px-6 hero-gradient overflow-hidden">
        <div className="absolute inset-0 auth-mesh opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 border border-cyan-200/60 bg-white/80 backdrop-blur text-cyan-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 shadow-sm">
              <Lock className="w-3.5 h-3.5" />
              HIPAA-minded security · Patient-first design
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Your Complete Digital{' '}
              <span className="text-gradient">Healthcare Ecosystem</span>
            </h1>
            <p className="text-lg text-slate-600 mb-4 max-w-xl leading-relaxed">
              Centralized medical records, AI-assisted healthcare guidance, secure hospital
              management, and a patient experience designed for trust — not complexity.
            </p>
            <ul className="space-y-2 mb-8 text-slate-600 text-sm sm:text-base">
              {[
                'One place for prescriptions, labs & visit history',
                'Upload records you already have from other hospitals',
                'Find nearby care with real hospital discovery',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <ChevronRight className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="btn-primary flex items-center justify-center gap-2 group"
              >
                Start your health journey
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#why" className="btn-secondary text-center">
                Why MediCentral
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/30 to-cyan-400/20 rounded-3xl blur-3xl" />
            <div
              className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/30 aspect-[4/3] hero-image-cover"
              role="img"
              aria-label="Healthcare professional caring for a patient in a modern hospital"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-sm font-medium text-cyan-200">Connected care</p>
                <p className="text-xl font-bold">Every record. Every visit. One timeline.</p>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute -bottom-4 -left-4 glass-card p-4 rounded-2xl max-w-[200px] shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2.5 rounded-xl">
                  <Stethoscope className="text-emerald-600 h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Care status</p>
                  <p className="text-sm font-bold text-slate-900">Records synced</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="absolute -top-4 -right-2 glass-card p-4 rounded-2xl shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2.5 rounded-xl">
                  <BrainCircuit className="text-blue-600 h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Insights</p>
                  <p className="text-sm font-bold text-slate-900">Symptom assistant</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="why" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-cyan-600 font-semibold text-sm uppercase tracking-wider mb-2">
              Why MediCentral
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Healthcare software that feels human
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Enterprise-grade for hospitals. Warm and clear for patients. No jargon — just the
              care experience you deserve.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {trustFeatures.map((f, i) => (
              <AnimatedCard key={f.title} delay={i * 0.1}>
                <div className="flex gap-4 p-2">
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                    <f.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything your care journey needs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedCard delay={0.1}>
              <div className="premium-feature-icon bg-blue-50">
                <FileText className="text-blue-600 h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Unified Medical Records</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Doctor visits, prescriptions, voice notes, surgery media, and your own uploaded
                history — one secure timeline.
              </p>
            </AnimatedCard>
            <AnimatedCard delay={0.2}>
              <div className="premium-feature-icon bg-indigo-50">
                <BrainCircuit className="text-indigo-600 h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Wellness & guidance</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Symptom assistant for educational support. Always confirm with a licensed
                clinician for diagnosis.
              </p>
            </AnimatedCard>
            <AnimatedCard delay={0.3}>
              <div className="premium-feature-icon bg-purple-50">
                <Map className="text-purple-600 h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Hospital discovery</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Locate nearby hospitals with real map data — built for emergencies and planned
                care across India and beyond.
              </p>
            </AnimatedCard>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-slate-900 via-[#0f3460] to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center mb-16">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="text-4xl lg:text-5xl font-extrabold text-cyan-400 mb-2">{s.value}</div>
                <div className="text-slate-400 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="mb-16">
            <h3 className="text-2xl font-bold text-center mb-10 flex items-center justify-center gap-2">
              <LineChart className="w-6 h-6 text-cyan-400" />
              How hospitals & patients work together
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {workflowSteps.map((w) => (
                <div
                  key={w.step}
                  className="glass-card-dark rounded-2xl p-5 border border-white/10 text-left"
                >
                  <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-sm mb-3">
                    {w.step}
                  </span>
                  <h4 className="font-bold mb-2">{w.title}</h4>
                  <p className="text-slate-400 text-sm">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((t) => (
              <motion.blockquote
                key={t.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="glass-card-dark rounded-2xl p-8 border border-white/10"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-200 italic mb-4">&ldquo;{t.quote}&rdquo;</p>
                <footer>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to take control of your health?</h2>
          <p className="text-slate-600 mb-8">
            Join MediCentral — where hospitals run smoothly and patients feel seen.
          </p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2">
            Create free account <ChevronRight className="w-5 h-5" />
          </Link>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4" />
            Setup takes less than 2 minutes
          </p>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <HeartPulse className="h-6 w-6 text-cyan-400" />
            <span className="text-lg font-bold">
              Medi<span className="text-cyan-400">Central</span>
            </span>
          </div>
          <p className="text-sm">© 2026 MediCentral. Secure · Patient-first · Built for modern care.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
