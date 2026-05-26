import { VitalsService } from '../vitals/vitals.service.js';
import { TimelineService } from '../timeline/timeline.service.js';

const provenanceTitle = (tenant, branch, title) => {
  const t = tenant?.name || tenant?.slug || 'Hospital';
  const b = branch?.name || branch?.city || '';
  return `${t}${b ? ` ${b}` : ''} — ${title}`;
};

export class WardOpsService {
  static getVisitWardContext(visit) {
    return {
      inpatient: visit.inpatient || {},
      vitals: visit.vitals,
      vitalsLog: (visit.vitalsLog || []).slice(-10).reverse(),
      nursingNotes: (visit.nursingNotes || []).slice(-15).reverse(),
      surgery: visit.surgery || {},
      workflowState: visit.workflowState,
      visitType: visit.visitType,
    };
  }

  static async updateAdmission({ visit, patient, tenant, branch, body }) {
    visit.inpatient = {
      ...(visit.inpatient?.toObject?.() || visit.inpatient || {}),
      wardName: body.wardName || visit.inpatient?.wardName,
      bedNumber: body.bedNumber || visit.inpatient?.bedNumber,
      roomNumber: body.roomNumber || visit.inpatient?.roomNumber,
      icu: body.icu ?? visit.inpatient?.icu,
      observationNotes: body.observationNotes ?? visit.inpatient?.observationNotes,
    };
    if (body.icu) visit.priority = 'critical';
    await visit.save();

    if (body.wardName || body.bedNumber) {
      await TimelineService.appendEvent({
        patient,
        visit,
        tenant,
        branch,
        type: 'admission',
        title: provenanceTitle(
          tenant,
          branch,
          `Allocated ${body.wardName || 'ward'}${body.bedNumber ? ` · Bed ${body.bedNumber}` : ''}`
        ),
        summary: body.roomNumber ? `Room ${body.roomNumber}` : 'Bed allocation updated',
        payload: { inpatient: visit.inpatient },
        sourceRef: visit._id,
        sourceModel: 'HospitalVisit',
      });
    }

    return visit.inpatient;
  }

  static async addNursingNote({ visit, patient, tenant, branch, text, staff }) {
    const note = {
      text,
      authorName: staff?.user?.name || 'Nursing staff',
      author: staff?._id,
      createdAt: new Date(),
    };
    visit.nursingNotes = visit.nursingNotes || [];
    visit.nursingNotes.push(note);
    await visit.save();

    await TimelineService.appendEvent({
      patient,
      visit,
      tenant,
      branch,
      type: 'workflow',
      title: provenanceTitle(tenant, branch, 'Nursing note added'),
      summary: text.slice(0, 120),
      payload: { nursing: true },
      sourceRef: visit._id,
      sourceModel: 'HospitalVisit',
    });

    return note;
  }

  static recordVitals(args) {
    return VitalsService.recordVitals(args);
  }
}

export default WardOpsService;
