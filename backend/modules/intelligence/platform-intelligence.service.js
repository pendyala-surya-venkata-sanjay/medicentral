import { EcosystemService } from '../interoperability/ecosystem.service.js';
import HospitalVisit from '../../models/HospitalVisit.js';
import ConsentAccess from '../../models/platform/ConsentAccess.js';
import { CONSENT_STATUS } from '../../../shared/constants/timeline.js';

export class PlatformIntelligenceService {
  static computeHealthScore(analytics, tenants) {
    const emergencies = tenants?.reduce((s, t) => s + (t.metrics?.emergencies || 0), 0) || 0;
    let score = 100;
    if (emergencies > 5) score -= 15;
    if (analytics?.billingPending > 10) score -= 10;
    if (analytics?.consentPending > 8) score -= 5;
    const overload = tenants?.some((t) => t.metrics?.activeVisits > 50);
    if (overload) score -= 10;
    return Math.max(0, Math.min(100, score));
  }

  static async buildMovementHeatmap() {
    const visits = await HospitalVisit.find()
      .populate('tenant', 'slug name')
      .populate('branch', 'name city')
      .sort({ checkIn: -1 })
      .limit(500)
      .lean();

    const flows = {};
    visits.forEach((v) => {
      const key = v.tenant?.slug || 'unknown';
      flows[key] = (flows[key] || 0) + 1;
    });

    return Object.entries(flows).map(([slug, count]) => ({ tenant: slug, visits: count }));
  }

  static async buildPlatformAI({ tenants, analytics, feed }) {
    const healthScore = this.computeHealthScore(analytics, tenants);
    const heatmap = await this.buildMovementHeatmap();

    const crossTraffic = await ConsentAccess.countDocuments({
      status: CONSENT_STATUS.APPROVED,
    });

    const totalEmergencies = tenants?.reduce((s, t) => s + (t.metrics?.emergencies || 0), 0) || 0;
    const emergencyPattern =
      analytics?.activeVisits > 0
        ? `${Math.round((totalEmergencies / Math.max(analytics.activeVisits, 1)) * 100)}% of active visits flagged urgent/critical across network`
        : 'No active emergency surge detected';

    const narrative = [
      `Network health score: ${healthScore}/100 (heuristic).`,
      `${tenants?.length || 0} hospital systems online.`,
      `${analytics?.crossHospitalShares || 0} approved cross-hospital record shares.`,
      `${analytics?.timelineEventsWeek || 0} timeline events in the past 7 days.`,
      emergencyPattern + '.',
      feed?.[0]?.title ? `Latest activity: ${feed[0].title}.` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return {
      source: 'deterministic',
      llmReady: true,
      healthScore,
      heatmap,
      crossHospitalTraffic: crossTraffic,
      emergencyPattern,
      narrative,
      recommendations: [
        healthScore < 70 ? 'Review billing queues at high-load branches' : null,
        analytics?.consentPending > 5 ? 'Patient consent backlog — monitor approvals' : null,
        analytics?.surgeriesToday > 3 ? 'Elevated surgical volume today' : null,
      ].filter(Boolean),
    };
  }

  static buildNetworkGraph(tenants, analytics) {
    const nodes = (tenants || []).map((t, i) => ({
      id: t.tenant.slug,
      label: t.tenant.name,
      x: 120 + (i % 3) * 180,
      y: 80 + Math.floor(i / 3) * 120,
      activeVisits: t.metrics?.activeVisits || 0,
      emergencies: t.metrics?.emergencies || 0,
      branches: t.branches?.length || 0,
    }));

    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        links.push({
          source: nodes[i].id,
          target: nodes[j].id,
          weight: analytics?.crossHospitalShares
            ? Math.min(5, Math.ceil((analytics.crossHospitalShares || 1) / nodes.length))
            : 1,
          type: 'interop',
        });
      }
    }

    return { nodes, links, pulse: analytics?.activeVisits || 0 };
  }

  static async getEnhancedOverview() {
    const tenants = await EcosystemService.getTenantOverview();
    const analytics = await EcosystemService.getNetworkAnalytics();
    const feed = await EcosystemService.getActivityFeed({ limit: 20 });
    const ai = await this.buildPlatformAI({ tenants, analytics, feed });
    const networkGraph = this.buildNetworkGraph(tenants, analytics);
    return { tenants, analytics, feed, ai, networkGraph };
  }
}

export default PlatformIntelligenceService;
