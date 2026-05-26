import { emitQueueUpdate, getIO } from '../notifications/socket.server.js';
import { SOCKET_EVENTS, SOCKET_NAMESPACES } from '../notifications/socket.events.js';

export const emitConsentRequested = async ({ tenant, branch, consent, patient }) => {
  if (tenant?.slug && branch?.slug) {
    emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.CONSENT_REQUESTED, {
      consentId: consent._id,
      patientId: patient?.patientId,
    });
  }
  const io = getIO();
  if (io) {
    io.of(SOCKET_NAMESPACES.QUEUES).emit(SOCKET_EVENTS.CONSENT_REQUESTED, {
      consentId: consent._id,
      requestingTenant: tenant?.name,
    });
  }
};

export const emitConsentApproved = async ({ tenant, branch, consent, grantingTenant }) => {
  if (tenant?.slug && branch?.slug) {
    emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.CONSENT_APPROVED, {
      consentId: consent._id,
    });
    emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.CROSS_HOSPITAL_ACCESS_GRANTED, {
      consentId: consent._id,
      grantingTenant: grantingTenant?.name,
    });
    emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.TIMELINE_SHARED, {
      consentId: consent._id,
    });
  }
  const io = getIO();
  if (io) {
    io.of(SOCKET_NAMESPACES.QUEUES).emit(SOCKET_EVENTS.TENANT_ACTIVITY, {
      type: 'consent_approved',
      message: `${tenant?.name} — cross-hospital access granted`,
    });
  }
};

export default { emitConsentRequested, emitConsentApproved };
