import ConsentAccess from '../models/platform/ConsentAccess.js';

import Patient from '../models/Patient.js';

import HospitalTenant from '../models/platform/HospitalTenant.js';

import Branch from '../models/platform/Branch.js';

import { CONSENT_STATUS } from '../../shared/constants/timeline.js';

import {

  normalizeScope,

  ACCESS_DURATION,

  DURATION_MS,

  CONSENT_SCOPES,

} from '../../shared/constants/consent.js';

import { TimelineService } from '../modules/timeline/timeline.service.js';

import { NotificationService } from '../modules/notifications/notification.service.js';

import { PatientAccessService } from '../modules/interoperability/patient-access.service.js';

import {
  emitConsentRequested,
  emitConsentApproved,
} from '../modules/interoperability/interop.notifications.js';
import { AuditService } from '../modules/audit/audit.service.js';
import { AUDIT_ACTIONS } from '../modules/audit/audit.actions.js';



const provenanceTitle = (tenant, branch, title) => {

  const t = tenant?.name || tenant?.slug || 'Hospital';

  const b = branch?.name || branch?.city || '';

  return `${t}${b ? ` ${b}` : ''} — ${title}`;

};



export const requestConsent = async (req, res, next) => {

  try {

    const { patientId, scope, scopeLevel, notes, grantingTenantSlug, accessDuration } = req.body;

    const patient = await Patient.findOne({ patientId });

    if (!patient) {

      res.status(404);

      throw new Error('Patient not found');

    }



    const requestingTenant = req.tenant;

    let grantingTenant = null;



    if (grantingTenantSlug) {

      grantingTenant = await HospitalTenant.findOne({ slug: grantingTenantSlug.toLowerCase() });

    } else {

      grantingTenant = await PatientAccessService.detectGrantingTenant(

        patient._id,

        requestingTenant._id

      );

    }



    const existing = await ConsentAccess.findOne({

      patient: patient._id,

      requestingTenant: requestingTenant._id,

      status: CONSENT_STATUS.PENDING,

    });

    if (existing) {

      return res.json(existing);

    }



    const level = scopeLevel || normalizeScope(scope)[0];

    const duration = accessDuration || ACCESS_DURATION.TEMPORARY;



    const consent = await ConsentAccess.create({

      patient: patient._id,

      requestingTenant: requestingTenant._id,

      grantingTenant: grantingTenant?._id,

      scope: [level],

      scopeLevel: level,

      accessDuration: duration,

      notes,

      requestedBy: req.staff?._id,

      status: CONSENT_STATUS.PENDING,

    });



    const branch = req.branch || (await Branch.findOne({ tenant: requestingTenant._id }));



    await TimelineService.appendEvent({

      patient,

      tenant: requestingTenant,

      branch,

      type: 'consent',

      title: provenanceTitle(

        requestingTenant,

        branch,

        `requested access to ${grantingTenant?.name || 'medical'} records`

      ),

      summary: notes || `Scope: ${level}`,

      payload: { consentId: consent._id, scopeLevel: level, grantingTenant: grantingTenant?.slug },

      sourceRef: consent._id,

      sourceModel: 'ConsentAccess',

    });



    if (grantingTenant) {

      await TimelineService.appendEvent({

        patient,

        tenant: grantingTenant,

        branch: null,

        type: 'consent',

        title: provenanceTitle(grantingTenant, null, 'External hospital requested records'),

        summary: `${requestingTenant.name} awaiting patient approval`,

        payload: { consentId: consent._id },

        sourceRef: consent._id,

        sourceModel: 'ConsentAccess',

      });

    }



    const patientUser = patient.user;

    if (patientUser) {

      await NotificationService.notifyUser({

        userId: patientUser,

        tenant: requestingTenant,

        type: 'consent_request',

        title: 'Hospital records access request',

        message: `${requestingTenant.name} requests permission to view your medical history (${level})`,

        payload: { consentId: consent._id },

      });

    }



    await emitConsentRequested({ tenant: requestingTenant, branch, consent, patient });

    await AuditService.record({
      req,
      action: AUDIT_ACTIONS.CONSENT_REQUEST,
      entity: 'consent',
      entityId: consent._id,
      after: { patientId, scopeLevel: level, grantingTenant: grantingTenant?.slug },
    });

    res.status(201).json(consent);

  } catch (error) {

    next(error);

  }

};



export const getMyConsentRequests = async (req, res, next) => {

  try {

    const patient = await Patient.findOne({ user: req.user._id });

    if (!patient) {

      res.status(404);

      throw new Error('Patient profile not found');

    }

    const list = await ConsentAccess.find({ patient: patient._id })

      .populate('requestingTenant', 'slug name')

      .populate('grantingTenant', 'slug name')

      .sort({ createdAt: -1 });

    res.json(list);

  } catch (error) {

    next(error);

  }

};



export const resolveConsent = async (req, res, next) => {

  try {

    const { approve, accessDuration } = req.body;

    const patient = await Patient.findOne({ user: req.user._id });

    const consent = await ConsentAccess.findById(req.params.id)

      .populate('requestingTenant')

      .populate('grantingTenant');

    if (!consent || consent.patient.toString() !== patient._id.toString()) {

      res.status(404);

      throw new Error('Consent request not found');

    }



    consent.status = approve ? CONSENT_STATUS.APPROVED : CONSENT_STATUS.REJECTED;

    consent.approvedAt = approve ? new Date() : undefined;

    if (approve) {

      const duration = accessDuration || consent.accessDuration || ACCESS_DURATION.TEMPORARY;

      consent.accessDuration = duration;

      consent.expiresAt = new Date(Date.now() + (DURATION_MS[duration] || DURATION_MS.temporary));

    } else {

      consent.expiresAt = undefined;

    }

    await consent.save();



    const tenant = consent.requestingTenant;

    const grantingTenant = consent.grantingTenant;



    await TimelineService.appendEvent({

      patient,

      tenant,

      type: 'consent',

      title: approve

        ? provenanceTitle(tenant, null, 'Cross-hospital access approved')

        : provenanceTitle(tenant, null, 'Access request declined'),

      summary: grantingTenant?.name

        ? `Sharing with ${tenant?.name} · ${consent.scopeLevel}`

        : tenant?.name,

      payload: { consentId: consent._id, status: consent.status, scopeLevel: consent.scopeLevel },

      sourceRef: consent._id,

      sourceModel: 'ConsentAccess',

    });



    if (approve && grantingTenant) {

      await TimelineService.appendEvent({

        patient,

        tenant: grantingTenant,

        type: 'consent',

        title: provenanceTitle(grantingTenant, null, 'Records shared with partner hospital'),

        summary: `${tenant?.name} · ${consent.scopeLevel}`,

        payload: { consentId: consent._id },

        sourceRef: consent._id,

        sourceModel: 'ConsentAccess',

      });



      const branch = await Branch.findOne({ tenant: tenant._id });

      await emitConsentApproved({ tenant, branch, consent, grantingTenant });

    }

    await AuditService.record({
      req,
      action: approve ? AUDIT_ACTIONS.CONSENT_APPROVE : AUDIT_ACTIONS.CONSENT_DENY,
      entity: 'consent',
      entityId: consent._id,
      after: { status: consent.status, scopeLevel: consent.scopeLevel },
    });

    res.json(consent);

  } catch (error) {

    next(error);

  }

};



export const checkConsent = async (req, res, next) => {

  try {

    const patient = await Patient.findOne({ patientId: req.params.patientId });

    if (!patient) {

      res.status(404);

      throw new Error('Patient not found');

    }



    const access = await PatientAccessService.evaluateAccess({

      patient,

      staff: req.staff,

      tenant: req.tenant,

      operationalRole: req.operationalRole,

    });



    res.json({

      hasAccess: access.allowed,

      reason: access.reason,

      scopeLevel: access.scopeLevel,

      consent: access.consent,

      sameTenant: access.reason === 'local_visit',

    });

  } catch (error) {

    next(error);

  }

};



export const listConsentScopes = async (req, res) => {

  res.json({

    scopes: Object.values(CONSENT_SCOPES),

    durations: Object.values(ACCESS_DURATION),

  });

};


