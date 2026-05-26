import { WorkflowTransitionService } from '../modules/workflows/workflow-transition.service.js';
import { PharmacyOpsService } from '../modules/pharmacy/pharmacy-ops.service.js';
import { buildPatientCard } from '../utils/patientCard.js';

export const getPharmacyVisitContext = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const pharmacy = await PharmacyOpsService.getVisitPharmacyContext(visit, visit.patient);
    const patient = await buildPatientCard(visit.patient, visit);
    const actions = WorkflowTransitionService.getAvailableForVisit(visit, req.operationalRole);
    res.json({ patient, pharmacy, visit, availableActions: actions });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const loadPrescriptionsToQueue = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const items = await PharmacyOpsService.loadFromPrescriptions({
      visit,
      patient: visit.patient,
    });
    res.json({ fulfillment: items });
  } catch (error) {
    next(error);
  }
};

export const pharmacyTransition = async (req, res, next) => {
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
