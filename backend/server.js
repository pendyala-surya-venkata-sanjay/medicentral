import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { validateEnv } from './config/validateEnv.js';
import { ensureDemoDataSeeded } from './utils/seedDemoData.js';
import { ensureFoundationSeeded } from './utils/ensureFoundationSeeded.js';
import { initSocketFoundation } from './modules/notifications/socket.server.js';
import { logger } from './utils/logger.js';
import { trustProxy, sanitizeInput, securityHeaders } from './middleware/securityMiddleware.js';
import { requestTrace } from './middleware/requestTrace.js';
import { globalLimiter, authLimiter, opsLimiter, uploadLimiter } from './middleware/rateLimiters.js';
import mongoSanitize from 'express-mongo-sanitize';

import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import recordRoutes from './routes/recordRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import ocrRoutes from './routes/ocrRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import surgeryRoutes from './routes/surgeryRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import hospitalOpsRoutes from './routes/hospitalOpsRoutes.js';
import timelineRoutes from './routes/timelineRoutes.js';
import metaRoutes from './routes/metaRoutes.js';
import labRoutes from './routes/labRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import patientPortalRoutes from './routes/patientPortalRoutes.js';
import patientDocumentRoutes from './routes/patientDocumentRoutes.js';
import foundationRoutes from './routes/foundationRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import opsRoutes from './routes/opsRoutes.js';
import labOpsRoutes from './routes/labOpsRoutes.js';
import billingOpsRoutes from './routes/billingOpsRoutes.js';
import consentRoutes from './routes/consentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import wardOpsRoutes from './routes/wardOpsRoutes.js';
import surgeryOpsRoutes from './routes/surgeryOpsRoutes.js';
import pharmacyOpsRoutes from './routes/pharmacyOpsRoutes.js';
import dischargeOpsRoutes from './routes/dischargeOpsRoutes.js';
import interopRoutes from './routes/interopRoutes.js';
import platformRoutes from './routes/platformRoutes.js';
import intelligenceRoutes from './routes/intelligenceRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const envConfig = validateEnv();
const app = express();
const PORT = envConfig.port;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

trustProxy(app);

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:80', 'http://localhost:3000'];

const isAllowedCorsOrigin = (origin) => {
  if (!origin) return true;
  if (corsOrigins.includes(origin)) return true;
  if (/^https:\/\/[\w.-]+\.vercel\.app$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedCorsOrigin(origin));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(securityHeaders);
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(requestTrace);
app.use(express.json({ limit: '10kb' }));
app.use(sanitizeInput);
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  next();
});
app.use(globalLimiter);

app.get('/', async (req, res) => {
  res.json({
    status: 'ok',
    service: 'MediCentral API',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: 'phase-7',
  });
});

app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/uploads', uploadLimiter, uploadRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/surgery', surgeryRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/hospital-ops', hospitalOpsRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/patient-portal', patientPortalRoutes);
app.use('/api/patient-documents', uploadLimiter, patientDocumentRoutes);
app.use('/api/foundation', foundationRoutes);
app.use('/api/workflow', opsLimiter, workflowRoutes);
app.use('/api/queues', opsLimiter, queueRoutes);
app.use('/api/ops', opsLimiter, opsRoutes);
app.use('/api/lab-ops', opsLimiter, labOpsRoutes);
app.use('/api/billing-ops', opsLimiter, billingOpsRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ward-ops', opsLimiter, wardOpsRoutes);
app.use('/api/surgery-ops', opsLimiter, surgeryOpsRoutes);
app.use('/api/pharmacy-ops', opsLimiter, pharmacyOpsRoutes);
app.use('/api/discharge-ops', opsLimiter, dischargeOpsRoutes);
app.use('/api/interop', interopRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/intelligence', intelligenceRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await connectDB();

  if (process.env.SEED_DEMO_DATA === 'true') {
    const result = await ensureDemoDataSeeded();
    if (result.seeded) {
      logger.info('demo_data_seeded', { patientId: result.patientId });
    }
  }

  const foundation = await ensureFoundationSeeded();
  if (foundation.seeded) {
    logger.info('foundation_seeded');
  }

  await import('./modules/tenants/tenant.service.js').then(({ TenantService }) =>
    TenantService.ensureDemoTenants()
  );

  const httpServer = createServer(app);
  initSocketFoundation(httpServer);

  httpServer.listen(PORT, () => {
    logger.info('server_started', { port: PORT, env: envConfig.nodeEnv });
    console.log(`Server running on port ${PORT} [${envConfig.nodeEnv}]`);
    console.log(`Health: http://localhost:${PORT}/health`);
  });
};

startServer().catch((err) => {
  logger.error('server_start_failed', { error: err.message });
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
