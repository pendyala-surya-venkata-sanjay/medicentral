import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.js';
import { HealthService } from '../modules/observability/health.service.js';

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(await HealthService.basic());
});

router.get('/ready', async (req, res) => {
  const health = await HealthService.basic();
  if (health.db !== 'connected') {
    return res.status(503).json({ ready: false, ...health });
  }
  res.json({ ready: true, ...health });
});

router.get(
  '/detailed',
  protect,
  attachStaffContext,
  requireSuperAdmin,
  async (req, res, next) => {
    try {
      res.json(await HealthService.detailed());
    } catch (e) {
      next(e);
    }
  }
);

router.get('/launch', async (req, res, next) => {
  try {
    res.json(await HealthService.launchMetrics());
  } catch (e) {
    next(e);
  }
});

export default router;
