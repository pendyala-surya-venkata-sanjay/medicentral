import { GlobalTimelineService } from '../interoperability/global-timeline.service.js';
import HospitalVisit from '../../models/HospitalVisit.js';

const GROUP_LABELS = {
  lab: 'Lab & diagnostics',
  vitals: 'Vitals monitoring',
  surgery: 'Surgery & procedures',
  prescription: 'Medications',
  workflow: 'Care pathway',
  consent: 'Cross-hospital',
  admission: 'Admission',
  discharge: 'Discharge',
  billing: 'Billing',
  visit: 'Visits',
};

const isPinned = (ev) =>
  ev.type === 'consent' ||
  /emergency|critical|surgery completed|admitted|discharge/i.test(ev.title || '') ||
  ev.data?.priority === 'critical';

export class TimelineIntelligenceService {
  static groupEvents(events) {
    const byType = {};
    events.forEach((ev) => {
      const key = ev.type || 'other';
      if (!byType[key]) byType[key] = [];
      byType[key].push(ev);
    });

    const groups = Object.entries(byType).map(([type, items]) => {
      const sorted = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
      const hospital = sorted[0]?.hospital;
      const label = GROUP_LABELS[type] || type;
      const count = sorted.length;
      let summary = `${count} ${label} event${count > 1 ? 's' : ''}`;
      if (type === 'lab') summary = `${count} lab report${count > 1 ? 's' : ''} added`;
      if (type === 'vitals') summary = `${count} vitals update${count > 1 ? 's' : ''}`;
      if (type === 'surgery') summary = count > 1 ? 'Surgery & post-op events' : sorted[0]?.title;
      if (type === 'consent' && count) summary = 'Cross-hospital transfer & consent';
      return {
        type,
        label,
        summary,
        count,
        hospital,
        latestAt: sorted[0]?.date,
        pinned: sorted.some(isPinned),
        events: sorted,
      };
    });

    groups.sort((a, b) => new Date(b.latestAt) - new Date(a.latestAt));
    return groups;
  }

  /** Group events into per-visit folders (hospital visit timelines). */
  static groupByVisit(events) {
    const byVisit = new Map();
    const orphans = [];

    events.forEach((ev) => {
      const vid =
        ev.visitId ||
        (ev.type === 'visit' ? ev.id?.toString() : null) ||
        ev.data?.visit?.toString?.() ||
        (typeof ev.data?.visit === 'string' ? ev.data.visit : null);
      if (vid) {
        if (!byVisit.has(vid)) byVisit.set(vid, []);
        byVisit.get(vid).push(ev);
      } else {
        orphans.push(ev);
      }
    });

    const visitFolders = [...byVisit.entries()]
      .map(([visitId, evs]) => {
        const sorted = [...evs].sort((a, b) => new Date(b.date) - new Date(a.date));
        const anchor = sorted.find((e) => e.type === 'visit') || sorted[0];
        const hospital = anchor?.hospital || sorted.find((e) => e.hospital)?.hospital;
        const branch = anchor?.branch || sorted.find((e) => e.branch)?.branch;
        return {
          visitId,
          hospital,
          branch,
          summary: anchor?.title || 'Hospital visit',
          startedAt: sorted[sorted.length - 1]?.date,
          latestAt: sorted[0]?.date,
          count: sorted.length,
          events: sorted,
        };
      })
      .sort((a, b) => new Date(b.latestAt) - new Date(a.latestAt));

    return { visitFolders, orphanEvents: orphans };
  }

  static async enrichVisitFolders(visitFolders) {
    if (!visitFolders.length) return visitFolders;
    const ids = visitFolders.map((f) => f.visitId).filter(Boolean);
    const visits = await HospitalVisit.find({ _id: { $in: ids } })
      .select('timelineOpen timelineClosedAt workflowState')
      .lean();
    const byId = Object.fromEntries(visits.map((v) => [v._id.toString(), v]));

    return visitFolders.map((folder) => {
      const v = byId[folder.visitId];
      const closed =
        v != null
          ? v.timelineOpen === false || v.workflowState === 'DISCHARGED'
          : folder.events.some((e) => /discharged|discharge summary|visit folder closed/i.test(e.title || ''));
      return {
        ...folder,
        closed,
        closedAt: v?.timelineClosedAt || null,
        workflowState: v?.workflowState,
      };
    });
  }

  static async buildSmartTimeline(patient, { access = null } = {}) {
    const raw = await GlobalTimelineService.buildForPatient(patient, { access });
    const events = raw.events || [];
    const pinned = events.filter(isPinned).slice(0, 5);
    const groups = this.groupEvents(events);
    const { visitFolders: rawFolders, orphanEvents } = this.groupByVisit(events);
    const visitFolders = await this.enrichVisitFolders(rawFolders);

    const compressedSummary = groups
      .slice(0, 5)
      .map((g) => g.summary)
      .join(' · ');

    return {
      ...raw,
      smart: true,
      source: 'deterministic',
      compressedSummary,
      pinnedEvents: pinned,
      groups,
      visitFolders,
      orphanEvents,
      totalEvents: events.length,
    };
  }
}

export default TimelineIntelligenceService;
