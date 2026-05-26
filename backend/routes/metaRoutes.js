import express from 'express';
import { getIndiaMeta } from '../controllers/metaController.js';

const router = express.Router();

router.get('/india', getIndiaMeta);

export default router;
