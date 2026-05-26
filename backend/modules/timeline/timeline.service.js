import TimelineEvent from '../../models/platform/TimelineEvent.js';
import { LEGACY_TIMELINE_TYPE_MAP, TIMELINE_EVENT_TYPES } from '../../../shared/constants/timeline.js';

/**
 * Structured timeline foundation — complements legacy aggregator in timelineController.
 */
export class TimelineService {
  static normalizeType(legacyOrCanonical) {
    return LEGACY_TIMELINE_TYPE_MAP[legacyOrCanonical] || legacyOrCanonical;
  }

  static async appendEvent({
    patient,
    visit = null,
    tenant = null,
    branch = null,
    type,
    title,
    summary,
    payload,
    sourceRef,
    sourceModel,
    occurredAt = new Date(),
  }) {
    const canonicalType = this.normalizeType(type);
    return TimelineEvent.create({
      patient: patient._id || patient,
      visit: visit?._id || visit,
      tenant: tenant?._id || tenant,
      branch: branch?._id || branch,
      type: canonicalType,
      title,
      summary,
      payload,
      sourceRef: sourceRef?.toString?.(),
      sourceModel,
      occurredAt,
    });
  }

  static async getGlobalTimeline(patientId, { limit = 100 } = {}) {
    return TimelineEvent.find({ patient: patientId })
      .populate('tenant', 'slug name')
      .populate('branch', 'slug name city')
      .sort({ occurredAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Convert legacy aggregator event shape → TimelineEvent fields (for migration).
   */
  static fromLegacyAggregatorEvent(patientId, event) {
    return {
      patient: patientId,
      type: this.normalizeType(event.type),
      title: event.title,
      summary: event.summary,
      payload: event.data,
      occurredAt: event.date ? new Date(event.date) : new Date(),
      sourceRef: event.id,
    };
  }

  static getEventTypes() {
    return Object.values(TIMELINE_EVENT_TYPES);
  }
}

export default TimelineService;
