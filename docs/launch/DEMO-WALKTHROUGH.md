# Demo Walkthrough Guide

**Duration:** ~12 minutes  
**Prep:** `cd backend && npm run seed:launch`  
**Password:** `demo123` for all demo accounts

## Act 1 — Patient initiates (2 min)

1. Login: `patient@demo.com`
2. Open **Patient Hub** — highlight cinematic timeline and global ID.
3. **Pre-book** a VIP slot (presentation seed may show existing prebook).
4. Open **Hospitals** map (patient-only) — emergency / locator story.
5. Optional: **Symptom Assistant** — stress disclaimer, not diagnosis.

## Act 2 — Hospital receives (3 min)

1. Login: `staff@demo.com` (reception) — show VIP in queue.
2. Switch: `pa@demo.com` — preparation queue live.
3. Switch: `doctor@demo.com` — consultation, AI summary on visit.

## Act 3 — Clinical path (3 min)

1. `lab@demo.com` — lab queue completion.
2. Ward / surgery dashboards — OT metrics (seeded traffic).
3. `billing@demo.com` — pending charges.
4. Discharge — visit reaches discharged state.

## Act 4 — Interoperability (2 min)

1. Back to **patient** — second hospital visit narrative.
2. Grant **consent** — show shared records on other tenant.
3. Timeline shows cross-hospital events (after `seed:presentation`).

## Act 5 — Command Center (2 min)

1. Login: `superadmin@demo.com`
2. Open **Command Center**
3. Point out: Launch Health panel, live metrics, network graph, patient ecosystem search.

## Presentation mode

Set `PRESENTATION_MODE=true` on API to tag launch health responses (investor badge in UI).

## Closing line

> "MediCentral is a deployable healthcare operating system — one patient identity, many hospitals, queue-driven ops, and consent-first interoperability."

Full doc index: [INDEX.md](./INDEX.md)
