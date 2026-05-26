# QA Validation Summary

## Automated smoke

```bash
cd backend
npm run dev          # terminal 1
npm run qa:smoke     # terminal 2
```

Covers: health liveness/readiness, patient login + cockpit, staff login + ops queue, platform overview (super admin).

## Manual journey checklist

| # | Flow | Account | Pass criteria |
|---|------|---------|---------------|
| 1 | Patient registration | new patient | Account created, dashboard loads |
| 2 | Reception onboarding | staff@demo.com | Visit created, queue item |
| 3 | PA preparation | pa@demo.com | Queue advances |
| 4 | Doctor consultation | doctor@demo.com | Consultation + summary |
| 5 | Lab workflow | lab@demo.com | Lab queue completes |
| 6 | Surgery workflow | surgery role / seed | OT metrics update |
| 7 | Pharmacy | pharmacy dashboard | Dispense queue |
| 8 | Billing | billing@demo.com | Pending → cleared |
| 9 | Discharge | discharge dashboard | Terminal state |
| 10 | Interoperability | patient + 2 hospitals | Consent + shared view |
| 11 | Consent sharing | patient portal | Grant/revoke works |
| 12 | Patient timeline | patient@demo.com | Events after seed:presentation |
| 13 | AI summary | doctor view | Summary panel renders |
| 14 | Super admin analytics | superadmin@demo.com | Command Center metrics |
| 15 | Emergency assistance | patient maps | Patient-only route |
| 16 | VIP pre-book | patient prebook | Reception sees VIP |

Password for seeded accounts: **`demo123`**.

## Quality gates

- No dead queues after `seed:launch`
- No orphan visits in presentation seed
- Frontend `npm run build` succeeds
- `/health/ready` returns `ready: true` when DB up

## Known limitations

- Symptom assistant is rules-based, not clinical-grade ML
- Full 16-step manual pass requires human verification per release
