# Security Architecture

## Authentication

- Short-lived JWT access tokens
- HttpOnly refresh cookies (rotation on refresh)
- Role-based route protection on frontend and backend

## Authorization

- **RBAC** via `shared/constants/permissions.js` + `requirePermission` middleware
- **Tenant scope** — `STRICT_TENANT_SCOPE=true` in production limits staff to assigned hospital
- Super Admin bypass only on platform routes

## Data protection

- Medical uploads via authenticated `/api/uploads/:filename`
- Upload size limits + MIME validation
- Rate limits: global, auth, ops, upload tiers
- CSRF considerations on cookie-based refresh (same-site, trusted origins)

## Observability

- `AuditLog` for sensitive actions
- Health endpoints: `/health`, `/health/ready`, `/health/detailed`, `/health/launch`

## Production checklist

See [SECURITY-AUDIT.md](./SECURITY-AUDIT.md) and [docs/phase-7/DEPLOYMENT.md](../phase-7/DEPLOYMENT.md).
