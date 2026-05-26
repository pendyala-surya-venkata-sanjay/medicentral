import { WorkflowTransitionService } from '../modules/workflows/workflow-transition.service.js';
import { SurgeryOpsService } from '../modules/surgery/surgery-ops.service.js';
import { buildPatientCard } from '../utils/patientCard.js';

export const getSurgeryVisitContext = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const surgery = SurgeryOpsService.getVisitSurgeryContext(visit);
    const patient = await buildPatientCard(visit.patient, visit);
    const actions = WorkflowTransitionService.getAvailableForVisit(visit, req.operationalRole);
    res.json({ patient, surgery, visit, availableActions: actions });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const updateSurgeryPlan = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const surgery = await SurgeryOpsService.updateSurgeryPlan({
      visit,
      patient: visit.patient,
      tenant: req.tenant,
      branch: req.branch,
      body: req.body,
    });
    res.json({ surgery });
  } catch (error) {
    next(error);
  }
};

export const uploadSurgeryMedia = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const files = req.files || (req.file ? [req.file] : []);
    const uploaded = await SurgeryOpsService.uploadSurgeryMedia({
      visit,
      patient: visit.patient,
      tenant: req.tenant,
      branch: req.branch,
      req,
      files,
      body: req.body,
    });
    res.status(201).json(uploaded);
  } catch (error) {
    next(error);
  }
};

export const surgeryTransition = async (req, res, next) => {
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
