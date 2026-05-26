import LabReport from '../../models/LabReport.js';
import { publicUrl } from '../../middleware/uploadMiddleware.js';
import { TimelineService } from '../timeline/timeline.service.js';

export class LabOpsService {
  static async getVisitLabContext(visit) {
    const reports = await LabReport.find({ visit: visit._id }).sort({ createdAt: -1 });
    return {
      orders: visit.labOrders || [],
      instructions: visit.labInstructions,
      reports,
    };
  }

  static async uploadReport({
    visit,
    patient,
    tenant,
    branch,
    req,
    file,
    body,
  }) {
    const report = await LabReport.create({
      patient: patient._id,
      visit: visit._id,
      tenant: tenant?._id,
      branch: branch?._id,
      testName: body.testName || file?.originalname || 'Diagnostic report',
      category: body.category || 'pathology',
      result: body.result || body.findings,
      normalRange: body.normalRange,
      status: 'completed',
      reportUrl: file ? publicUrl(file) : undefined,
      notes: body.notes || body.findings,
      completedAt: new Date(),
    });

    const order = (visit.labOrders || []).find(
      (o) => o.testName === body.testName || o.category === body.category
    );
    if (order) order.status = 'completed';

    if (body.vitals) {
      visit.vitals = { ...visit.vitals?.toObject?.() || visit.vitals, ...body.vitals };
    }
    await visit.save();

    const tenantName = tenant?.name || 'Hospital';
    const branchName = branch?.name || branch?.city || '';

    await TimelineService.appendEvent({
      patient,
      visit,
      tenant,
      branch,
      type: 'lab',
      title: `${tenantName} ${branchName} — ${report.testName} uploaded`.trim(),
      summary: report.result || 'Diagnostics completed',
      payload: { reportId: report._id, category: report.category },
      sourceRef: report._id,
      sourceModel: 'LabReport',
    });

    return report;
  }
}

export default LabOpsService;
