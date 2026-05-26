# Interoperability Architecture

## Consent-driven sharing

Patients grant **scoped consent** for another hospital to access specific record types. Shares are:

- Time-bounded where configured
- Audited (who accessed what, when)
- Visible on patient timeline and Command Center activity feed

## Cross-hospital flows

1. Patient completes visit at Hospital A → records in global profile.
2. Patient visits Hospital B → requests consent.
3. Staff at B sees permitted records after consent approval.
4. Super Admin sees **interop traffic** metrics network-wide.

## Presentation demo

`npm run seed:presentation` adds a cross-hospital consent scenario for live demos.

## Standards positioning

Current implementation uses **first-party REST + MongoDB** with FHIR-ready extension points. Production roadmap includes HL7/FHIR adapters (see [Future Roadmap](./11-FUTURE-ROADMAP.md)).
