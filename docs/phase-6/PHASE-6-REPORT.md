# Phase 6 — Enterprise UX + Mobile + Advanced Realtime Experience

## Design principle

**Experience layer only.** Phase 6 wraps existing workflows, queues, intelligence APIs, and Socket.IO events in a premium operational shell — without new clinical modules, LLM integrations, or architecture changes.

---

## 1. UX architecture summary

```
┌─────────────────────────────────────────────────────────────┐
│  Layout (ops routes) — dark chrome, full-width main           │
├─────────────────────────────────────────────────────────────┤
│  OpsShell — header, LiveIndicator, NotificationCenter,        │
│             LiveWidgets, MobileOpsNav                         │
├─────────────────────────────────────────────────────────────┤
│  OpsQueueLayout — mobile snap queue + desktop sidebar         │
│  WorkflowPipeline · JourneyTimeline · QueuePatientCard (ops) │
├─────────────────────────────────────────────────────────────┤
│  Existing: useQueue · useOpsContext · Phase 5 intelligence    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Enterprise theme & glassmorphism

**`frontend/src/index.css`**
- `.ops-theme` — dark operational palette, typography, scrollbars
- `.ops-glass` — frosted panels (`backdrop-blur`, slate borders)
- Animations: `pulse-live`, `emergency-border-pulse`, `queue-enter`
- Safe-area + `touch-manipulation` for mobile queue swipes

**`Layout.jsx`**
- Detects `/ops/*` and `/platform` → `layout-ops`, dark sticky header, edge-to-edge main

---

## 3. OpsShell & operational chrome

| Prop | Purpose |
|------|---------|
| `title` / `subtitle` / `icon` | Role-branded gradient header |
| `role` | Accent gradient + `LiveWidgets` personalization |
| `refreshKey` | Drives `useLivePulse` “Queue updated” chip |
| `showWidgets` | Toggle live metrics strip |

Integrated on all ops dashboards + Command Center uses matching `ops-theme` wrapper.

---

## 4. Realtime experience

| Mechanism | Behavior |
|-----------|----------|
| `useQueue` + Socket.IO | Unchanged queue refresh contract |
| `useLivePulse(refreshKey)` | Brief visual pulse when queue data changes |
| `LiveIndicator` | Persistent “Live” dot in shell header |
| `useNotifications` | Drawer + toast on `notification:new`, `SMART_ALERT` |
| Backend | `GET /notifications/unread-count`, `POST /notifications/read-all` |

---

## 5. Notification center

- **`NotificationCenter.jsx`** — slide-over drawer, severity colors, mark-all-read
- **`useNotifications.js`** — fetch list, unread badge, socket subscription
- **`notification.service.js`** — `unreadCount()`, `markAllRead()`
- **`socket.events.js`** — `SMART_ALERT` channel for intelligence-driven ops alerts

---

## 6. Mobile-first queue UX

**`OpsQueueLayout.jsx`**
- Mobile: horizontal snap-scroll queue strip (`scroll-snap`)
- Desktop: classic sidebar + detail split
- **`MobileOpsNav.jsx`** — bottom nav for primary ops roles on small screens
- **`QueuePatientCard`** `variant="ops"` — min-width cards, motion enter, workflow badge

---

## 7. Workflow visualizer & journey timeline

**`shared/constants/workflow-pipeline.js`**
- `VISUAL_PIPELINE` — ordered care pathway labels
- `getPipelineProgress(workflowState)` — step index for progress UI

**`WorkflowPipeline.jsx`** — compact pathway on doctor (and extensible to other detail panels)

**`JourneyTimeline.jsx`** — hospital filter chips + dark `SmartTimeline` wrapper

---

## 8. Live widgets & Command Center

**`LiveWidgets.jsx`** — role-aware cards from `GET /intelligence/ops/insights`

**`CommandCenter.jsx`**
- `ops-theme` immersive layout
- `LiveIndicator` + `LiveWidgets role="super_admin"`
- `IntelligentSearch` for global patient pick
- Preserves Phase 4 tenant network + activity feed + Phase 5 AI network summary

---

## 9. Dashboard migration status

| Dashboard | OpsShell | Metrics `variant="ops"` | Notes |
|-----------|----------|-------------------------|-------|
| Doctor | ✅ | ✅ | Full `OpsQueueLayout`, pipeline, journey |
| Reception | ✅ | ✅ | Interop + intelligent search |
| PA | ✅ | ✅ | Preparation queue |
| Lab | ✅ | ✅ | Lab transitions unchanged |
| Billing | ✅ | ✅ | Custom list UI retained |
| Ward | ✅ | ✅ | Inpatient controls |
| Surgery | ✅ | ✅ | OT workflow |
| Pharmacy | ✅ | ✅ | Dispense → billing |
| Discharge | ✅ | ✅ | Printable packet |
| Command Center | ✅ (theme) | N/A | Platform-wide |

Patient dashboard remains **light theme** (consumer-friendly).

---

## 10. New / updated files

| Area | Files |
|------|-------|
| Enterprise UI | `frontend/src/components/enterprise/*` (8 components) |
| Hooks | `useNotifications.js`, `useLivePulse.js` |
| Shared | `shared/constants/workflow-pipeline.js` |
| Backend | `notification.service.js`, `notificationController.js`, `notificationRoutes.js`, `socket.events.js` |
| Styling | `index.css`, `Layout.jsx`, `QueueMetricsBar`, `QueuePatientCard`, `SmartTimeline` dark mode |
| Ops pages | All `*Dashboard.jsx` under `pages/ops/` |

---

## 11. Enterprise gaps remaining

- Full dark adaptation of inline forms inside legacy panels (`PatientSmartPanel`, billing custom cards)
- `ActivityFeed` as standalone widget (feed data exists on Command Center)
- Push notifications (mobile PWA)
- Per-alert acknowledge / escalate workflows
- Haptic feedback on critical queue updates
- Accessibility audit (contrast, focus rings on glass panels)

---

## 12. Phase 7 recommendations

1. **Progressive Web App** — installable ops app with offline queue cache  
2. **Role-specific micro-animations** — surgery OT countdown, ward bed map hints  
3. **Command Center drill-down** — tenant → branch → live queue deep links  
4. **Notification routing rules** — role + severity + quiet hours  
5. **Kiosk mode** — reception large-touch layout  
6. **Audit UX** — who viewed patient record + AI summary disclaimer logs  

---

## Success condition

- Ops staff land in a **cohesive dark command environment** with live pulse and notifications  
- Queues remain **workflow-driven** (no new CRUD flows)  
- Doctor dashboard shows **pathway + journey** without replacing clinical actions  
- Mobile users can **swipe queues** and use bottom nav  
- Super Admin Command Center feels like a **network operations center**  
- Phase 5 intelligence is **surfaced**, not replaced  

**Run:** `cd frontend && npm run build` · seed `cd backend && npm run seed:foundation`

**Demo ops logins:** `staff@demo.com`, `pa@demo.com`, `doctor@demo.com`, `lab@demo.com`, `billing@demo.com`, `ward@demo.com`, `superadmin@demo.com`
