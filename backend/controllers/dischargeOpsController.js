import { WorkflowTransitionService } from '../modules/workflows/workflow-transition.service.js';
import { DischargeOpsService } from '../modules/discharge/discharge-ops.service.js';
import { buildPatientCard } from '../utils/patientCard.js';

export const getDischargeVisitContext = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const patient = await buildPatientCard(visit.patient, visit);
    const actions = WorkflowTransitionService.getAvailableForVisit(visit, req.operationalRole);
    res.json({
      patient,
      visit,
      discharge: visit.discharge,
      availableActions: actions,
    });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const generateDischargeSummary = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const packet = await DischargeOpsService.generateDischargePacket({
      visit,
      patient: visit.patient,
      tenant: req.tenant,
      branch: req.branch,
    });
    res.json({ discharge: packet, printable: packet.summary });
  } catch (error) {
    next(error);
  }
};

export const dischargeTransition = async (req, res, next) => {
  try {
    const result = await WorkflowTransitionService.transition({
      visitId: req.params.visitId,
      action: req.body.action,
      notes: req.body.notes,
      meta: req.body.meta,
      req,
      operationalRole: req.operationalRole,
    });
    res.json(result);
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};
