import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireStaffContext } from '../middleware/requireStaffContext.js';
import { requirePermission } from '../middleware/requirePermission.js';
import {
  requestConsent,
  getMyConsentRequests,
  resolveConsent,
  checkConsent,
  listConsentScopes,
} from '../controllers/consentController.js';

const router = express.Router();

router.get('/scopes', listConsentScopes);
router.post(
  '/request',
  protect,
  attachStaffContext,
  requireStaffContext,
  requirePermission('request_consent'),
  requestConsent
);
router.get('/check/:patientId', protect, attachStaffContext, requireStaffContext, checkConsent);
router.get('/my', protect, getMyConsentRequests);
router.post('/:id/resolve', protect, resolveConsent);

export default router;
