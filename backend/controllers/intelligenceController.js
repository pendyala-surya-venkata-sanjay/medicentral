import HospitalVisit from '../models/HospitalVisit.js';
import PatientDocument from '../models/PatientDocument.js';
import { PatientSummaryService } from '../modules/intelligence/patient-summary.service.js';
import { TimelineIntelligenceService } from '../modules/intelligence/timeline-intelligence.service.js';
import { ClinicalAssistantService } from '../modules/intelligence/clinical-assistant.service.js';
import { SmartSearchService } from '../modules/intelligence/smart-search.service.js';
import { OperationalInsightsService } from '../modules/intelligence/operational-insights.service.js';
import { PlatformIntelligenceService } from '../modules/intelligence/platform-intelligence.service.js';
import { DocumentIntelligenceService } from '../modules/intelligence/document-intelligence.service.js';
import { AlertEngineService } from '../modules/intelligence/alert-engine.service.js';

export const getPatientSummary = async (req, res, next) => {
  try {
    const visit = req.query.visitId
      ? await HospitalVisit.findById(req.query.visitId).lean()
      : null;
    const summary = await PatientSummaryService.buildSummary(req.patient, {
      access: req.access,
      visit,
    });
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

export const getSmartTimeline = async (req, res, next) => {
  try {
    const timeline = await TimelineIntelligenceService.buildSmartTimeline(req.patient, {
      access: req.access,
    });
    res.json(timeline);
  } catch (error) {
    next(error);
  }
};

export const getClinicalAssistant = async (req, res, next) => {
  try {
    const visit = req.query.visitId
      ? await HospitalVisit.findById(req.query.visitId).lean()
      : null;
    const panel = await ClinicalAssistantService.buildAssistantPanel(req.patient, {
      access: req.access,
      visit,
    });
    res.json(panel);
  } catch (error) {
    next(error);
  }
};

export const getPatientAlerts = async (req, res, next) => {
  try {
    const visit = req.query.visitId
      ? await HospitalVisit.findById(req.query.visitId).lean()
      : null;
    const panel = await ClinicalAssistantService.buildAssistantPanel(req.patient, {
      access: req.access,
      visit,
    });
    res.json({ alerts: panel.alerts, assistOnly: true });
  } catch (error) {
    next(error);
  }
};

export const smartSearch = async (req, res, next) => {
  try {
    const tenantId = req.tenant?._id || null;
    const data = await SmartSearchService.search({
      query: req.query.q,
      tenantId: req.operationalRole === 'super_admin' ? null : tenantId,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getOpsInsights = async (req, res, next) => {
  try {
    const insights = await OperationalInsightsService.buildForBranch({
      tenantId: req.tenant._id,
      branchId: req.branch._id,
      tenantSlug: req.tenant.slug,
      branchSlug: req.branch.slug,
    });
    res.json(insights);
  } catch (error) {
    next(error);
  }
};

export const getBranchAlerts = async (req, res, next) => {
  try {
    const alerts = await AlertEngineService.scanBranch({
      tenantId: req.tenant._id,
      branchId: req.branch._id,
      tenantSlug: req.tenant.slug,
      branchSlug: req.branch.slug,
    });
    res.json({ alerts });
  } catch (error) {
    next(error);
  }
};

export const getPlatformAIOverview = async (req, res, next) => {
  try {
    const overview = await PlatformIntelligenceService.getEnhancedOverview();
    res.json(overview);
  } catch (error) {
    next(error);
  }
};

export const analyzeDocument = async (req, res, next) => {
  try {
    const analysis = DocumentIntelligenceService.analyze({
      fileName: req.file?.originalname || req.body.fileName,
      mimeType: req.file?.mimetype || req.body.mimeType,
      category: req.body.category,
      title: req.body.title,
      description: req.body.description,
      ocrText: req.body.ocrText,
    });

    if (req.body.documentId) {
      await PatientDocument.findByIdAndUpdate(req.body.documentId, {
        aiExtraction: { ...analysis, analyzedAt: new Date() },
        category: analysis.suggestedCategory !== 'unknown' ? analysis.suggestedCategory : undefined,
      });
    }

    res.json(analysis);
  } catch (error) {
    next(error);
  }
};
