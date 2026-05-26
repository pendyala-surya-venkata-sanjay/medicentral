import { QueueService } from '../modules/queues/queue.service.js';
import { buildQueueCards } from '../utils/patientCard.js';
import { QUEUE_TYPES } from '../../shared/constants/queues.js';

const VALID_QUEUES = Object.values(QUEUE_TYPES);

export const getQueueMetrics = async (req, res, next) => {
  try {
    const metrics = await QueueService.getQueueMetrics({
      tenantId: req.tenant._id,
      branchId: req.branch._id,
    });
    res.json({ tenant: req.tenant.slug, branch: req.branch.slug, metrics });
  } catch (error) {
    next(error);
  }
};

export const getQueue = async (req, res, next) => {
  try {
    const queueType = req.params.queueType?.toUpperCase();
    if (!VALID_QUEUES.includes(queueType)) {
      res.status(400);
      throw new Error(`Invalid queue type. Use: ${VALID_QUEUES.join(', ')}`);
    }

    const { visits } = await QueueService.listQueue({
      tenantId: req.tenant._id,
      branchId: req.branch._id,
      queueType,
    });

    const cards = await buildQueueCards(visits);
    res.json({
      queueType,
      workflowStates: QueueService.getStatesForQueueType(queueType),
      count: cards.length,
      patients: cards,
    });
  } catch (error) {
    next(error);
  }
};
