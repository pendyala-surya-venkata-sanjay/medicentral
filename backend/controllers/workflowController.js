import { WorkflowTransitionService } from '../modules/workflows/workflow-transition.service.js';
import { WorkflowEngine } from '../modules/workflows/workflow.engine.js';

export const getVisitWorkflow = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const actions = WorkflowTransitionService.getAvailableForVisit(
      visit,
      req.operationalRole
    );
    res.json({
      visitId: visit._id,
      workflowState: visit.workflowState,
      availableActions: actions,
      describe: WorkflowEngine.describeState(visit.workflowState),
    });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const postTransition = async (req, res, next) => {
  try {
    const { toState, action, notes, meta } = req.body;
    const result = await WorkflowTransitionService.transition({
      visitId: req.params.visitId,
      toState,
      action,
      notes,
      meta,
      req,
      operationalRole: req.operationalRole,
    });
    res.json(result);
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};
