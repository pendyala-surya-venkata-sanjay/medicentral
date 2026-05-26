import { WorkflowTransitionService } from '../modules/workflows/workflow-transition.service.js';
import { LabOpsService } from '../modules/lab/lab-ops.service.js';
import { buildPatientCard } from '../utils/patientCard.js';

export const getLabVisitContext = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const lab = await LabOpsService.getVisitLabContext(visit);
    const patient = await buildPatientCard(visit.patient, visit);
    const actions = WorkflowTransitionService.getAvailableForVisit(visit, req.operationalRole);
    res.json({ patient, lab, visit, availableActions: actions });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const uploadLabReport = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const report = await LabOpsService.uploadReport({
      visit,
      patient: visit.patient,
      tenant: req.tenant,
      branch: req.branch,
      req,
      file: req.file,
      body: req.body,
    });
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

export const labTransition = async (req, res, next) => {
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
