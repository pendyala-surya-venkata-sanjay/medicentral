import { WORKFLOW_STATE_LIST, WORKFLOW_PIPELINE } from '../../shared/constants/workflow.js';
import { QUEUE_TYPE_LIST, PRIMARY_QUEUES, WORKFLOW_STATES_BY_QUEUE } from '../../shared/constants/queues.js';
import { WorkflowEngine } from '../modules/workflows/workflow.engine.js';
import { WORKFLOW_TRANSITIONS } from '../modules/workflows/workflow.transitions.js';
import { TenantService } from '../modules/tenants/tenant.service.js';
import { TimelineService } from '../modules/timeline/timeline.service.js';
import { getRoleCatalog } from '../modules/auth/rbac.js';
import { SOCKET_EVENTS, SOCKET_NAMESPACES } from '../modules/notifications/socket.events.js';
import { TIMELINE_EVENT_LIST } from '../../shared/constants/timeline.js';

export const getArchitecture = async (req, res) => {
  res.json({
    name: 'MediCentral Healthcare OS',
    version: '0.1.0-foundation',
    phase: 0,
    principles: ['PATIENT_GLOBAL', 'VISIT_LOCAL', 'QUEUE_FIRST', 'WORKFLOW_ORCHESTRATION'],
    layers: [
      'Patient Record Layer',
      'Workflow Engine',
      'Queue System',
      'Tenant Ecosystem',
    ],
    legacyApiPrefix: '/api',
    foundationApiPrefix: '/api/foundation',
    database: {
      runtime: 'mongodb',
      target: 'postgresql-prisma',
    },
  });
};

export const getWorkflowFoundation = async (req, res) => {
  res.json({
    states: WORKFLOW_STATE_LIST,
    pipeline: WORKFLOW_PIPELINE,
    transitions: WORKFLOW_TRANSITIONS,
    engine: WorkflowEngine.getPrimaryQueueTypes(),
  });
};

export const getQueueFoundation = async (req, res) => {
  res.json({
    queueTypes: QUEUE_TYPE_LIST,
    primaryQueues: PRIMARY_QUEUES,
    statesByQueue: WORKFLOW_STATES_BY_QUEUE,
  });
};

export const getTimelineFoundation = async (req, res) => {
  res.json({
    eventTypes: TimelineService.getEventTypes(),
    canonicalTypes: TIMELINE_EVENT_LIST,
    note: 'Legacy aggregator remains at GET /api/timeline/patient/:id',
  });
};

export const getRolesFoundation = async (req, res) => {
  res.json(getRoleCatalog());
};

export const getTenants = async (req, res, next) => {
  try {
    const tenants = await TenantService.listTenantsWithBranches();
    res.json(tenants);
  } catch (error) {
    next(error);
  }
};

export const getSocketFoundation = async (req, res) => {
  res.json({
    enabled: process.env.ENABLE_SOCKET === 'true',
    namespaces: SOCKET_NAMESPACES,
    events: SOCKET_EVENTS,
  });
};

export const getReusableModules = async (req, res) => {
  res.json({
    keep: [
      'auth (JWT, bcrypt, register/login)',
      'Patient MC-PT-* identity',
      'TreatmentTimeline UI + aggregator',
      'PatientUploadCenter / patient-documents',
      'PrescriptionForm / prescriptions API',
      'uploadMiddleware + protected /api/uploads',
      'billing GST model',
      'hospital-ops visit/admission/discharge',
      'Doctor patient search',
      'OCR + ML symptom assistant',
    ],
    refactor: [
      'HospitalVisit → tenant + workflowState backbone',
      'RBAC → Staff + operationalRole',
      'timelineController → TimelineEvent persistence',
      'hospitalOps → queue-driven handoffs',
      'mediaAccess → consent + tenant scope',
    ],
    rewriteLater: [
      'Multi-tenant isolation enforcement',
      'Full workflow transition API',
      'Role-specific operational dashboards',
      'PostgreSQL migration',
      'Cross-hospital consent UX',
    ],
  });
};
