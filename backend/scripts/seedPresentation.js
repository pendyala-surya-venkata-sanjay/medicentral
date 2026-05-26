/**
 * Presentation / investor demo seed — enriches existing foundation + demo data.
 * Run: npm run seed:foundation && npm run seed && npm run seed:presentation
 */
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { TenantService } from '../modules/tenants/tenant.service.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import HospitalVisit from '../models/HospitalVisit.js';
import PatientPrebook from '../models/platform/PatientPrebook.js';
import TimelineEvent from '../models/platform/TimelineEvent.js';
import ConsentAccess from '../models/platform/ConsentAccess.js';
import HospitalTenant from '../models/platform/HospitalTenant.js';
import Branch from '../models/platform/Branch.js';
import { WORKFLOW_STATES } from '../../shared/constants/workflow.js';
import { QUEUE_TYPES } from '../../shared/constants/queues.js';
import { QueueService } from '../modules/queues/queue.service.js';
import { CONSENT_STATUS } from '../../shared/constants/timeline.js';
import { generateTokenNumber } from '../utils/indiaHealthcare.js';

dotenv.config();

const seed = async () => {
  await connectDB();
  await TenantService.ensureDemoTenants();

  const apollo = await HospitalTenant.findOne({ slug: 'apollo' });
  const yashoda = await HospitalTenant.findOne({ slug: 'yashoda' });
  const apolloBranch = await Branch.findOne({ tenant: apollo._id, slug: 'hyderabad' });
  const yashodaBranch = await Branch.findOne({ tenant: yashoda._id, slug: 'bangalore' });

  const patientUser = await User.findOne({ email: 'patient@demo.com' });
  const patient = patientUser ? await Patient.findOne({ user: patientUser._id }) : null;

  if (patient && apollo && apolloBranch) {
    const existingVisit = await HospitalVisit.findOne({
      patient: patient._id,
      workflowState: WORKFLOW_STATES.WAITING_FOR_DOCTOR,
    });

    if (!existingVisit) {
      const token = await generateTokenNumber(HospitalVisit);
      const visit = await HospitalVisit.create({
        patient: patient._id,
        tenant: apollo._id,
        branch: apolloBranch._id,
        visitType: 'OP',
        tokenNumber: token,
        department: 'Cardiology',
        workflowState: WORKFLOW_STATES.WAITING_FOR_DOCTOR,
        currentQueueType: QUEUE_TYPES.DOCTOR,
        priority: 'normal',
        symptomNotes: 'Chest discomfort — presentation demo',
        vitals: { bp: '128/82', pulse: '78', spo2: '98' },
      });
      await QueueService.enqueueForVisit({
        visit,
        patient,
        tenant: apollo,
        branch: apolloBranch,
        workflowState: WORKFLOW_STATES.WAITING_FOR_DOCTOR,
      });
      console.log('Created demo visit in doctor queue:', token);
    }

    const prebookExists = await PatientPrebook.findOne({ patient: patient._id, status: 'pending' });
    if (!prebookExists) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      await PatientPrebook.create({
        patient: patient._id,
        tenant: apollo._id,
        branch: apolloBranch._id,
        department: 'General Medicine',
        scheduledAt: tomorrow,
        notes: 'VIP presentation pre-book',
        estimatedWaitMinutes: 10,
        status: 'pending',
      });
      console.log('Created VIP pre-book for patient@demo.com');
    }

    if (yashoda && yashodaBranch) {
      const consentExists = await ConsentAccess.findOne({
        patient: patient._id,
        requestingTenant: yashoda._id,
        status: CONSENT_STATUS.APPROVED,
      });
      if (!consentExists) {
        await ConsentAccess.create({
          patient: patient._id,
          requestingTenant: yashoda._id,
          grantingTenant: apollo._id,
          scope: ['full_access'],
          scopeLevel: 'full_access',
          accessDuration: 'temporary',
          status: CONSENT_STATUS.APPROVED,
          approvedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        console.log('Created cross-hospital consent (Apollo → Yashoda request approved)');
      }
    }

    const timelineCount = await TimelineEvent.countDocuments({ patient: patient._id });
    if (timelineCount < 3) {
      await TimelineEvent.create({
        patient: patient._id,
        tenant: apollo._id,
        branch: apolloBranch._id,
        type: 'workflow',
        title: 'Apollo Hyderabad — Consultation completed',
        summary: 'Presentation seed milestone',
        occurredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      });
      console.log('Added timeline milestone events');
    }
  }

  console.log('\nPresentation seed complete.');
  console.log('Demo accounts (password: demo123):');
  console.log('  patient@demo.com | staff@demo.com | doctor@demo.com | superadmin@demo.com');
  process.exit(0);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
