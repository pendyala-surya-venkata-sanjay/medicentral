import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Activity, Building2, ArrowRightLeft, Scissors, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';
import LiveIndicator from '../../components/enterprise/LiveIndicator';
import AnimatedMetricCard from '../../components/platform/AnimatedMetricCard';
import LiveHealthcareFeed from '../../components/platform/LiveHealthcareFeed';
import NetworkVisualization from '../../components/platform/NetworkVisualization';
import CinematicPatientSearch from '../../components/platform/CinematicPatientSearch';
import LaunchHealthPanel from '../../components/platform/LaunchHealthPanel';
import BrandedLoader from '../../components/brand/BrandedLoader';

const CommandCenter = () => {
  const [overview, setOverview] = useState(null);
  const [feed, setFeed] = useState([]);
  const [networkGraph, setNetworkGraph] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [ecosystem, setEcosystem] = useState(null);
  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/intelligence/platform/overview');
      setOverview({ tenants: data.tenants, analytics: data.analytics });
      setFeed(data.feed || []);
      setAi(data.ai);
      setNetworkGraph(data.networkGraph);
    } catch {
      try {
        const [ov, fd] = await Promise.all([
          api.get('/platform/overview'),
          api.get('/platform/activity-feed'),
        ]);
        setOverview(ov.data);
        setFeed(fd.data.feed || []);
      } catch {
        setOverview(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const openPatient = async (patientId) => {
    setSelectedPatient(patientId);
    try {
      const { data } = await api.get(`/platform/patients/${patientId}/ecosystem`);
      setEcosystem(data);
    } catch {
      setEcosystem(null);
    }
  };

  if (loading) {
    return (
      <div className="ops-theme min-h-[60vh]">
        <BrandedLoader label="Initializing Command Center…" />
      </div>
    );
  }

  const analytics = overview?.analytics;
  const tenants = overview?.tenants || [];
  const totalSurgeries = tenants.reduce((s, t) => s + (t.metrics?.surgeriesToday || 0), 0);
  const totalEmergencies = tenants.reduce((s, t) => s + (t.metrics?.emergencies || 0), 0);

  return (
    <div className="ops-theme min-h-full -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 space-y-6">
      <header className="rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white p-6 sm:p-8 shadow-2xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.25),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(34,211,238,0.12),_transparent_45%)]" />
        <div className="relative">
          <LiveIndicator active label="National network live" />
          <h1 className="text-2xl sm:text-4xl font-bold flex items-center gap-3 mt-4 tracking-tight">
            <Globe className="w-10 h-10 text-indigo-400" />
            Healthcare Command Center
          </h1>
          <p className="text-slate-400 mt-3 max-w-2xl text-sm sm:text-base">
            Mission control for {tenants.length} hospital systems · Realtime interoperability ·
            Ecosystem orchestration
          </p>
        </div>
      </header>

      <LaunchHealthPanel />

      {ai && (
        <motion.div
          className="ops-glass rounded-2xl border border-indigo-500/30 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">AI network intelligence</p>
          <p className="text-4xl font-bold text-white mt-2 tabular-nums">{ai.healthScore}/100</p>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">{ai.narrative}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <AnimatedMetricCard label="Active hospitals" value={tenants.length} icon={Building2} delay={0} />
        <AnimatedMetricCard label="Live visits" value={analytics?.activeVisits} icon={Activity} accent="cyan" delay={0.05} />
        <AnimatedMetricCard label="Surgeries today" value={totalSurgeries} icon={Scissors} accent="violet" delay={0.1} />
        <AnimatedMetricCard label="Emergency cases" value={totalEmergencies} icon={AlertTriangle} accent="red" delay={0.15} />
        <AnimatedMetricCard
          label="Interop traffic"
          value={analytics?.crossHospitalShares}
          icon={ArrowRightLeft}
          accent="emerald"
          delay={0.2}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <NetworkVisualization graph={networkGraph} tenants={tenants} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map((t, i) => (
              <div
                key={t.tenant._id}
                className="ops-glass rounded-2xl p-5 border border-slate-800/80 hover:border-cyan-500/20 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white">{t.tenant.name}</h3>
                    <p className="text-xs text-slate-500 capitalize">{t.tenant.slug}</p>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-semibold border border-emerald-500/30">
                    {t.metrics.activeVisits} live
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {t.branches.map((b) => (
                    <span
                      key={b._id}
                      className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-md"
                    >
                      {b.name || b.city}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
                  <div className="bg-orange-950/50 rounded-lg p-2 border border-orange-500/20">
                    <p className="font-bold text-orange-300">{t.metrics.surgeriesToday}</p>
                    <p className="text-orange-500/80">OT</p>
                  </div>
                  <div className="bg-amber-950/50 rounded-lg p-2 border border-amber-500/20">
                    <p className="font-bold text-amber-300">{t.metrics.billingPending}</p>
                    <p className="text-amber-500/80">Billing</p>
                  </div>
                  <div className="bg-red-950/50 rounded-lg p-2 border border-red-500/20">
                    <p className="font-bold text-red-300">{t.metrics.emergencies}</p>
                    <p className="text-red-500/80">Urgent</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <LiveHealthcareFeed feed={feed} />
      </div>

      <CinematicPatientSearch
        onSelectPatient={openPatient}
        ecosystem={ecosystem}
        selectedPatient={selectedPatient}
      />
    </div>
  );
};

export default CommandCenter;
