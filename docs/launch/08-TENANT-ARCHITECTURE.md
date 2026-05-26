# Tenant Architecture

## Model

- **Tenant** = hospital system (brand, slug, branches)
- **Branch** = physical site within tenant
- **Staff** = users scoped to tenant (+ role permissions)
- **Patient** = global user; visits link patient to tenant/branch

## Isolation

- `STRICT_TENANT_SCOPE` enforces query filters on staff APIs
- Super Admin operates on `platform/*` and intelligence routes
- Consent records reference source and target tenants explicitly

## Commercial fit

- One deployment serves many hospitals (true SaaS)
- Per-tenant branding hooks via tenant metadata
- Command Center aggregates without breaking isolation

## Enterprise sales narrative

"We onboard a hospital as a tenant in minutes; branches and departments inherit queue templates; patients keep one identity nationwide."
