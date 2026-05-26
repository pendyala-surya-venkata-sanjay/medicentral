# Architecture Overview

MediCentral is a **workflow-first healthcare operating system**: patients are global identities; visits and queues are hospital-scoped; super-admin sees the national network.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind, Framer Motion, Socket.io client |
| API | Node.js, Express 5, JWT + refresh cookies |
| Data | MongoDB (Atlas-ready) |
| ML | FastAPI — OCR + rules-based symptom assistant |
| Realtime | Socket.io on shared Express server |

## Core principles

1. **Patient = global** — one timeline, consent, pre-book, emergency map (patient-only).
2. **Visit = local** — tied to tenant + branch; drives OP/IP/surgery/billing queues.
3. **Queue-driven ops** — reception → PA → doctor → lab → ward → pharmacy → billing → discharge.
4. **Interop by consent** — cross-hospital record share with audit trail.

See also: [docs/ARCHITECTURE.md](../ARCHITECTURE.md) for implementation map.

## Service boundaries

```
Browser → React SPA → REST (/api) + WebSocket (/socket.io)
                    → MongoDB
                    → ML service (OCR, symptom rules)
                    → Upload storage (local / S3 / Cloudinary abstraction)
```

## Role surfaces

- **Patient** — cinematic hub, timeline, maps, symptom assistant.
- **Ops roles** — enterprise dashboards per queue (reception, PA, doctor, lab, billing, ward, surgery, pharmacy, discharge).
- **Super Admin** — Command Center, ecosystem health, platform analytics.
