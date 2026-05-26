import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  refreshSession,
  logoutUser,
  logoutAllSessions,
  listRegistrationHospitals,
} from '../controllers/authController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin } from '../middleware/validateMiddleware.js';
import { csrfProtection } from '../middleware/csrfProtection.js';

const router = express.Router();

router.get('/hospitals', listRegistrationHospitals);
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.post('/refresh', csrfProtection, refreshSession);
router.post('/logout', csrfProtection, optionalProtect, logoutUser);
router.post('/logout-all', protect, logoutAllSessions);
router.get('/profile', protect, getUserProfile);

export default router;
