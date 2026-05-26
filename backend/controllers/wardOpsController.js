import { WorkflowTransitionService } from '../modules/workflows/workflow-transition.service.js';
import { WardOpsService } from '../modules/ward/ward-ops.service.js';
import { buildPatientCard } from '../utils/patientCard.js';

export const getWardVisitContext = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const ward = WardOpsService.getVisitWardContext(visit);
    const patient = await buildPatientCard(visit.patient, visit);
    const actions = WorkflowTransitionService.getAvailableForVisit(visit, req.operationalRole);
    res.json({ patient, ward, visit, availableActions: actions });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const updateWardAdmission = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const inpatient = await WardOpsService.updateAdmission({
      visit,
      patient: visit.patient,
      tenant: req.tenant,
      branch: req.branch,
      body: req.body,
    });
    res.json({ inpatient });
  } catch (error) {
    next(error);
  }
};

export const recordVitals = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const result = await WardOpsService.recordVitals({
      visit,
      patient: visit.patient,
      tenant: req.tenant,
      branch: req.branch,
      vitals: req.body.vitals || req.body,
      staff: req.staff,
      notes: req.body.notes,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const addNursingNote = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const note = await WardOpsService.addNursingNote({
      visit,
      patient: visit.patient,
      tenant: req.tenant,
      branch: req.branch,
      text: req.body.text,
      staff: req.staff,
    });
    res.json(note);
  } catch (error) {
    next(error);
  }
};

export const wardTransition = async (req, res, next) => {
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
