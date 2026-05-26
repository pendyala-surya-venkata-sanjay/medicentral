# MediCentral — Investor Documentation Index

Startup-grade product documentation for deployment, diligence, and demos.

| # | Document | Audience |
|---|----------|----------|
| 1 | [Architecture Overview](./01-ARCHITECTURE-OVERVIEW.md) | Engineers, investors |
| 2 | [Workflow Engine](./02-WORKFLOW-ENGINE.md) | Product, clinical ops |
| 3 | [Interoperability](./03-INTEROPERABILITY.md) | Health IT, compliance |
| 4 | [Security Architecture](./04-SECURITY-ARCHITECTURE.md) | Security, legal |
| 5 | [AI Layer](./05-AI-LAYER.md) | Product, ML |
| 6 | [Deployment Guide](./06-DEPLOYMENT-GUIDE.md) | DevOps |
| 7 | [Scalability Plan](./07-SCALABILITY-PLAN.md) | CTO, investors |
| 8 | [Tenant Architecture](./08-TENANT-ARCHITECTURE.md) | Enterprise sales |
| 9 | [Queue System](./09-QUEUE-SYSTEM.md) | Engineering |
| 10 | [Realtime Architecture](./10-REALTIME-ARCHITECTURE.md) | Engineering |
| 11 | [Future Roadmap](./11-FUTURE-ROADMAP.md) | Investors, product |

## Launch operations

| Document | Purpose |
|----------|---------|
| [Security Audit](./SECURITY-AUDIT.md) | Final-phase security verification |
| [QA Validation](./QA-VALIDATION.md) | End-to-end journey checklist |
| [Demo Walkthrough](./DEMO-WALKTHROUGH.md) | Scripted investor demo |
| [Final Phase Report](./FINAL-PHASE-REPORT.md) | Launch readiness summary (12 deliverables) |

## Quick start

```bash
cd backend && npm run seed:launch
cd backend && npm run dev
cd frontend && npm run dev
cd backend && npm run qa:smoke   # API must be running
```

Demo password for all seeded accounts: **`demo123`**.
