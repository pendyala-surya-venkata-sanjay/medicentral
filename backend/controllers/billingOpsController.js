import Billing from '../models/Billing.js';
import { WorkflowTransitionService } from '../modules/workflows/workflow-transition.service.js';
import { VisitBillingService } from '../modules/billing/visit-billing.service.js';
import { buildPatientCard } from '../utils/patientCard.js';
import { TimelineService } from '../modules/timeline/timeline.service.js';

export const getBillingVisitContext = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    let bill = null;
    if (visit.billingSummary?.billId) {
      bill = await Billing.findById(visit.billingSummary.billId);
    }
    if (!bill) {
      bill = await VisitBillingService.ensureVisitBill({
        visit,
        patient: visit.patient,
        createdBy: req.user,
      });
    }
    const patient = await buildPatientCard(visit.patient, visit);
    const actions = WorkflowTransitionService.getAvailableForVisit(visit, req.operationalRole);
    res.json({ patient, bill, visit, availableActions: actions });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const billingTransition = async (req, res, next) => {
  try {
    const result = await WorkflowTransitionService.transition({
      visitId: req.params.visitId,
      action: req.body.action,
      notes: req.body.notes,
      meta: {
        paymentMethod: req.body.paymentMethod,
        reference: req.body.reference,
        amount: req.body.amount,
      },
      req,
      operationalRole: req.operationalRole,
    });
    res.json(result);
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const getBillingQueueSummary = async (req, res, next) => {
  try {
    const { QueueService } = await import('../modules/queues/queue.service.js');
    const { visits: billingVisits } = await QueueService.listQueue({
      tenantId: req.tenant._id,
      branchId: req.branch._id,
      queueType: 'BILLING',
    });
    const cards = [];
    for (const v of billingVisits) {
      const populated = await WorkflowTransitionService.loadVisit(v._id);
      let bill = null;
      if (populated.billingSummary?.billId) {
        bill = await Billing.findById(populated.billingSummary.billId);
      } else {
        bill = await VisitBillingService.ensureVisitBill({
          visit: populated,
          patient: populated.patient,
          createdBy: req.user,
        });
      }
      const card = await buildPatientCard(populated.patient, populated);
      cards.push({ ...card, bill });
    }
    res.json({ patients: cards });
  } catch (error) {
    next(error);
  }
};
