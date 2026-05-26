import { TimelineService } from '../timeline/timeline.service.js';
import { emitQueueUpdate } from '../notifications/socket.server.js';
import { SOCKET_EVENTS } from '../notifications/socket.events.js';

const provenanceTitle = (tenant, branch, title) => {
  const t = tenant?.name || tenant?.slug || 'Hospital';
  const b = branch?.name || branch?.city || '';
  return `${t}${b ? ` ${b}` : ''} — ${title}`;
};

const formatVitalsSummary = (v) => {
  const parts = [];
  if (v.bp) parts.push(`BP ${v.bp}`);
  if (v.pulse) parts.push(`Pulse ${v.pulse}`);
  if (v.spo2) parts.push(`SpO₂ ${v.spo2}`);
  if (v.temperature) parts.push(`Temp ${v.temperature}`);
  if (v.glucose) parts.push(`Sugar ${v.glucose}`);
  if (v.respiratoryRate) parts.push(`RR ${v.respiratoryRate}`);
  return parts.join(' · ') || 'Vitals recorded';
};

export class VitalsService {
  static async recordVitals({ visit, patient, tenant, branch, vitals, staff, notes }) {
    const entry = {
      bp: vitals.bp,
      pulse: vitals.pulse,
      temperature: vitals.temperature,
      spo2: vitals.spo2,
      glucose: vitals.glucose,
      respiratoryRate: vitals.respiratoryRate,
      recordedAt: new Date(),
      recordedBy: staff?._id,
      notes,
    };

    visit.vitalsLog = visit.vitalsLog || [];
    visit.vitalsLog.push(entry);
    visit.vitals = {
      ...entry,
      recordedAt: entry.recordedAt,
    };
    await visit.save();

    const summary = formatVitalsSummary(vitals);
    await TimelineService.appendEvent({
      patient,
      visit,
      tenant,
      branch,
      type: 'vitals',
      title: provenanceTitle(tenant, branch, summary),
      summary: notes || summary,
      payload: { vitals: entry },
      sourceRef: visit._id,
      sourceModel: 'HospitalVisit',
    });

    if (tenant?.slug && branch?.slug) {
      emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.VITALS_UPDATED, {
        visitId: visit._id,
        vitals: entry,
      });
    }

    return { latest: visit.vitals, log: visit.vitalsLog };
  }
}

export default VitalsService;
