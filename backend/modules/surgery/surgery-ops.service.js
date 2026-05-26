import PatientDocument from '../../models/PatientDocument.js';
import { publicUrl } from '../../middleware/uploadMiddleware.js';
import { TimelineService } from '../timeline/timeline.service.js';

const provenanceTitle = (tenant, branch, title) => {
  const t = tenant?.name || tenant?.slug || 'Hospital';
  const b = branch?.name || branch?.city || '';
  return `${t}${b ? ` ${b}` : ''} — ${title}`;
};

export class SurgeryOpsService {
  static getVisitSurgeryContext(visit) {
    return {
      surgery: visit.surgery || {},
      preOpNotes: visit.surgery?.preOpNotes,
      postOpNotes: visit.surgery?.postOpNotes,
      inpatient: visit.inpatient,
      vitals: visit.vitals,
    };
  }

  static async updateSurgeryPlan({ visit, patient, tenant, branch, body }) {
    visit.surgery = {
      ...(visit.surgery?.toObject?.() || visit.surgery || {}),
      procedureName: body.procedureName || visit.surgery?.procedureName,
      otRoom: body.otRoom || visit.surgery?.otRoom,
      surgeonName: body.surgeonName || visit.surgery?.surgeonName,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : visit.surgery?.scheduledAt,
      preOpNotes: body.preOpNotes || visit.surgery?.preOpNotes,
      postOpNotes: body.postOpNotes || visit.surgery?.postOpNotes,
      status: body.status || visit.surgery?.status,
    };
    await visit.save();
    return visit.surgery;
  }

  static async uploadSurgeryMedia({ visit, patient, tenant, branch, req, files, body }) {
    const uploaded = [];
    for (const file of files || []) {
      const doc = await PatientDocument.create({
        patient: patient._id,
        uploadedBy: req.user._id,
        source: 'staff',
        title: body.title || `Surgery — ${visit.surgery?.procedureName || 'OT'}`,
        category: 'surgery',
        fileUrl: publicUrl(file),
        mimeType: file.mimetype,
        notes: body.notes,
      });
      uploaded.push(doc);
    }

    if (uploaded.length) {
      await TimelineService.appendEvent({
        patient,
        visit,
        tenant,
        branch,
        type: 'surgery',
        title: provenanceTitle(tenant, branch, 'Surgery media uploaded'),
        summary: `${uploaded.length} file(s)`,
        payload: { documentIds: uploaded.map((d) => d._id) },
        sourceRef: visit._id,
        sourceModel: 'HospitalVisit',
      });
    }

    return uploaded;
  }
}

export default SurgeryOpsService;
