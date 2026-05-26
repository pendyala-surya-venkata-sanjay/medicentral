import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.js';
import { HealthService } from '../modules/observability/health.service.js';
import {
  getPlatformOverview,
  getPlatformAnalytics,
  getPlatformActivityFeed,
  searchPatientsPlatform,
  getPatientEcosystemPlatform,
} from '../controllers/platformController.js';

const router = express.Router();

router.use(protect, attachStaffContext, requireSuperAdmin);

router.get('/system-health', async (req, res, next) => {
  try {
    res.json(await HealthService.launchMetrics());
  } catch (e) {
    next(e);
  }
});
router.get('/overview', getPlatformOverview);
router.get('/analytics', getPlatformAnalytics);
router.get('/activity-feed', getPlatformActivityFeed);
router.get('/patients/search', searchPatientsPlatform);
router.get('/patients/:patientId/ecosystem', getPatientEcosystemPlatform);

export default router;
