import { TimelineService } from '../timeline/timeline.service.js';
import { emitQueueUpdate } from '../notifications/socket.server.js';
import { SOCKET_EVENTS } from '../notifications/socket.events.js';

const provenanceTitle = (tenant, branch, title) => {
  const t = tenant?.name || tenant?.slug || 'Hospital';
  const b = branch?.name || branch?.city || '';
  return `${t}${b ? ` ${b}` : ''} — ${title}`;
};

export class DischargeOpsService {
  static buildDischargeSummary(visit, patient) {
    const lines = [
      `Patient: ${patient?.user?.name || patient?.patientId || '—'}`,
      `Visit token: ${visit.tokenNumber || visit._id}`,
      `Department: ${visit.department || 'General'}`,
      `Admission: ${visit.inpatient?.wardName || 'OP'} ${visit.inpatient?.bedNumber ? `Bed ${visit.inpatient.bedNumber}` : ''}`,
      `Diagnosis: ${visit.diagnosisSummary || '—'}`,
      `Consultation: ${visit.consultationNotes || '—'}`,
      `Surgery: ${visit.surgery?.procedureName || 'N/A'} ${visit.surgery?.postOpNotes ? `— ${visit.surgery.postOpNotes}` : ''}`,
      `Latest vitals: ${visit.vitals?.bp ? `BP ${visit.vitals.bp}` : ''} ${visit.vitals?.pulse ? `Pulse ${visit.vitals.pulse}` : ''}`,
      `Discharged at: ${new Date().toISOString()}`,
    ];
    return lines.filter(Boolean).join('\n');
  }

  static async generateDischargePacket({ visit, patient, tenant, branch }) {
    const summary = this.buildDischargeSummary(visit, patient);
    visit.discharge = {
      summary,
      generatedAt: new Date(),
      archivedAt: null,
      packetUrl: null,
    };
    await visit.save();

    await TimelineService.appendEvent({
      patient,
      visit,
      tenant,
      branch,
      type: 'discharge',
      title: provenanceTitle(tenant, branch, 'Discharge summary generated'),
      summary: 'Digital discharge packet ready for print',
      payload: { discharge: true },
      sourceRef: visit._id,
      sourceModel: 'HospitalVisit',
    });

    if (tenant?.slug && branch?.slug) {
      emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.DISCHARGE_READY, {
        visitId: visit._id,
      });
    }

    return visit.discharge;
  }

  static async archiveVisit({ visit, patient, tenant, branch }) {
    visit.discharge = visit.discharge || {};
    visit.discharge.archivedAt = new Date();
    visit.timelineOpen = false;
    visit.timelineClosedAt = new Date();
    await visit.save();

    await TimelineService.appendEvent({
      patient,
      visit,
      tenant,
      branch,
      type: 'discharge',
      title: provenanceTitle(tenant, branch, 'Patient discharged'),
      summary: 'Visit folder closed · billing & records complete',
      payload: { archived: true, timelineClosed: true },
      sourceRef: visit._id,
      sourceModel: 'HospitalVisit',
    });

    return visit.discharge;
  }
}

export default DischargeOpsService;
