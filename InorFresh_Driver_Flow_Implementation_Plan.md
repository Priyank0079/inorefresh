# InorFresh — Driver & Logistics Flow: 5-Phase Implementation Plan

> **Status:** PLAN ONLY — no code changed yet.
> **Rule:** Do NOT disturb existing flows or UI. Everything is **additive** and lives
> **inside the existing 5 modules** (Customer, Warehouse, Delivery, Admin, Port).
> **No 6th module. No new login.**
> **After EVERY phase** I run a manual verification script (`tsx`) + a build check
> and report the result before moving to the next phase.

---

## Locked Decisions (from client)
- **ERP:** InorFresh *is* the ERP — no external integration.
- **Old flow:** Fully replace (old on-demand path retired in Phase 5, after pilot verify).
- **Route planner:** Both Warehouse Head and Admin can plan routes.
- **Partner drivers:** Separate driver logins (same driver app, `isPartner` flag).

## Safety Guarantees (how we avoid breaking anything)
1. New DB models + only **optional** new fields on `Order`/`Delivery`.
2. New API endpoints only — no existing endpoint changed or removed (until Phase 5 retirement).
3. New frontend **pages** only — existing pages/components reused, never rewritten.
4. Behind flag `LOGISTICS_FLOW_ENABLED` until verified.
5. Each phase = its own commit, independently revertible.

## How verification works (every phase)
- A script at `backend/src/scripts/verify-phaseN-*.ts`, run via a new npm script
  `npm run verify:phaseN` (uses `tsx`, connects to MongoDB, asserts, prints ✅/❌).
- Plus: `cd backend && npm run build` and `cd frontend && npm run build` must pass.
- I paste the script output back to you before starting the next phase.

---

# PHASE 1 — Data Foundation (Models)
**Goal:** Add the data layer for routes/stops/assets without changing any behavior.

### Backend
- NEW `backend/src/models/DeliveryRoute.ts` — route per vehicle/day
  (routeNumber, date, status, vehicle, driver, stops[], totals, timeline, distanceKm).
- NEW `backend/src/models/RouteStop.ts` — one retailer stop
  (route, order, sequence, retailer, status, arrivedAt/deliveredAt/gps,
   confirmation{method,proofUrl,otpVerified}, payment{...}, returns[], assets[]).
- NEW `backend/src/models/ReturnableAsset.ts` — crate/icebox ledger
  (type, route, stop, issued, collected, missing).
- EDIT `backend/src/models/Order.ts` — ADD optional: `confirmationMethod?`,
  `confirmationProofUrl?`; ADD `"Confirmed"` to status enum. (Nothing removed.)
- EDIT `backend/src/models/Delivery.ts` — ADD optional: `currentRoute?`, `isPartner?`.
- Register new models in `backend/src/models/index.ts`.

### Frontend
- None.

### NOT touched
- Every existing model field, every controller, all UI.

### ✅ Manual check — `npm run verify:phase1`
Script `verify-phase1-models.ts`:
1. Connects to DB, loads all models (asserts no schema/registration error).
2. Creates a throwaway `DeliveryRoute` + 2 `RouteStop` + 1 `ReturnableAsset`, reads them back, validates required fields, then deletes them.
3. Loads one existing `Order` and one `Delivery` — asserts old fields still present and readable.
4. Prints ✅ PHASE 1 PASSED or ❌ with the failure.
- Also: `cd backend && npm run build` passes.

**Done when:** script ✅ + backend build green. No frontend impact.

---

# PHASE 2 — Route Planning (Warehouse + Admin)
**Goal:** Warehouse/Admin can turn confirmed orders into vehicle routes.

### Backend
- ADD `"Confirmed"` order-confirm endpoint: `POST /warehouse/orders/:id/confirm`.
- Add `orderCutOffTime` (default 20:00) to `AppSettings`.
- NEW `backend/src/modules/warehouse/controllers/routeController.ts`:
  - `GET  /warehouse/routes/unplanned-orders` (today's confirmed, grouped by area)
  - `POST /warehouse/routes` (create — **validates min 10 stops**, one driver/vehicle)
  - `GET  /warehouse/routes`, `GET /warehouse/routes/:id`
  - `PUT  /warehouse/routes/:id` (edit sequence before finalize)
- Mount under existing router, gated `requireUserType("Warehouse","Admin")`.

### Frontend (same UI components)
- NEW `frontend/src/modules/warehouse/pages/WarehouseRoutePlanning.tsx`
  (reuse `WarehouseLayout`, card styles). Add nav item in `WarehouseSidebar`.
- Mount the same page in Admin routes (admin sidebar entry).

### NOT touched
- Customer/Delivery/Port. Existing warehouse pages.

### ✅ Manual check — `npm run verify:phase2`
Script `verify-phase2-routes.ts`:
1. Seeds (or finds) ≥10 confirmed test orders.
2. Calls create-route logic → asserts route saved with 10 stops + totals.
3. Tries to create a route with <10 stops → asserts it is **rejected**.
4. Lists routes → asserts the new one appears. Cleans up test data.
5. Prints ✅/❌.
- Also: both builds pass; open `/warehouse/route-planning` renders.

**Done when:** script ✅ + builds green + page visible to Warehouse & Admin.

---

# PHASE 3 — Driver Route Execution (Accept → Load → Deliver → Confirm)
**Goal:** Driver runs the route up to delivery confirmation.

### Backend (extend delivery module)
- `GET  /delivery/routes/today` (driver's route + summary)
- `POST /delivery/routes/:id/accept`            → status `Accepted`
- `POST /delivery/routes/:id/verify-load`       → `Loaded` (+ writes asset `issued`)
- `POST /delivery/routes/:id/start`             → `Out For Delivery` (+ `dispatchedAt`)
- `POST /delivery/stops/:stopId/arrived`        (GPS + time; reuse proximity helpers)
- `PUT  /delivery/stops/:stopId/deliver`        (qty verify)
- `POST /delivery/stops/:stopId/confirm`        (OTP via existing API / Signature / Photo via existing upload)

### Frontend (reuse `DeliveryLayout`, `DashboardCard`, `SummaryBar`)
- NEW `pages/DriverRouteToday.tsx` (route-centric dashboard card + Accept).
- NEW `pages/DriverLoadingVerify.tsx` (checklist → Loaded).
- NEW `pages/DriverRouteStops.tsx` (ordered stop list with status pills).
- NEW `pages/DriverStopDetail.tsx` (Arrived → Deliver → Confirm section).
- Add routes in `DeliveryRoutes.tsx` (existing routes kept). Add "Route" tab in `DeliveryBottomNav`.

### NOT touched
- Old dashboard still works (we add alongside; retire only in Phase 5).
- Wallet/earnings/profile/notifications.

### ✅ Manual check — `npm run verify:phase3`
Script `verify-phase3-driver.ts` simulates one driver day:
1. Assign a test route to a test driver → accept → assert `Accepted`.
2. verify-load → assert `Loaded` + asset `issued` recorded.
3. start → assert `Out For Delivery` + `dispatchedAt` set.
4. stop arrived → assert gps+time; deliver → assert qty; confirm (OTP) → assert `Delivered` on stop.
5. Asserts timeline timestamps in order. Cleans up. Prints ✅/❌.
- Also: builds pass; driver screens render and navigate.

**Done when:** script ✅ + builds green + driver can complete a stop in the UI.

---

# PHASE 4 — Payment, Returns & Returnable Assets
**Goal:** Capture money, on-spot returns, and crate/icebox collection per stop; complete route.

### Backend
- `POST /delivery/stops/:stopId/payment` `{ method, amount, referenceNo, proofUrl }`
  (updates existing driver `cashCollected`; emits real-time to accounts).
- `POST /delivery/stops/:stopId/return`  `{ reason, qtyKg, photoUrl(required), action }`
  (bridges to existing `Return`/returnWorkflow when action = warehouse return).
- `POST /delivery/stops/:stopId/assets`  `{ type, qtyCollected }` → ledger.
- `POST /delivery/routes/:id/complete`   → `Completed` (totals: stops, distance, deliveries).

### Frontend
- Extend `DriverStopDetail.tsx` with Payment + Returns + Assets sections.
- NEW `pages/DriverRouteComplete.tsx` (summary + Complete Route).

### NOT touched
- Customer/Warehouse/Admin/Port. Existing wallet logic (we only += cashCollected).

### ✅ Manual check — `npm run verify:phase4`
Script `verify-phase4-collection.ts`:
1. On a delivered stop: record payment (UPI w/ ref) → assert stop.payment + driver.cashCollected increased.
2. Record a return WITHOUT photo → assert **rejected**; WITH photo → assert saved.
3. Record asset collection → assert ledger `collected` updated.
4. Complete route → assert `Completed` + totals. Cleans up. Prints ✅/❌.
- Also: builds pass; UI sections work.

**Done when:** script ✅ + builds green + full stop lifecycle works in UI.

---

# PHASE 5 — Reconciliation, Daily Report & Old-Flow Retirement
**Goal:** Close the loop at the warehouse, produce the daily report, retire old flow, clean up.

### Backend
- `GET  /warehouse/routes/:id/reconcile` (expected vs returned: fish, crates, cash).
- `POST /warehouse/routes/:id/reconcile` → `Reconciled` (computes asset `missing`).
- **Enforce:** driver "day closed" blocked until route is `Reconciled` (server-side).
- `GET  /warehouse/reports/daily-logistics?date=` (extend `reportController`):
  sales / logistics(on-time %) / returns / materials(missing) / collections.

### Frontend
- NEW `frontend/src/modules/warehouse/pages/WarehouseReconciliation.tsx`.
- NEW Daily Logistics Report page (reuse `WarehouseSalesReport` styling); link in Admin too.

### Retirement & cleanup (full-replace decision)
- Flip `LOGISTICS_FLOW_ENABLED=true`; remove old on-demand dashboard section
  ("New Available Orders" / nearby-accept) + its endpoints (separate commit).
- Delete verified-unused mock files (zero imports — re-grep first):
  `warehouse/data/{mockData,categoryMockData,productMockData,orderMockData}.ts`.

### ✅ Manual check — `npm run verify:phase5`
Script `verify-phase5-reconcile.ts`:
1. On a completed route: run reconcile → assert `Reconciled` + missing-crate math correct.
2. Try to "close day" before reconcile → assert **blocked**; after → assert allowed.
3. Call daily-logistics report → assert totals match the seeded route.
4. Cleans up. Prints ✅/❌.
- Also: `grep` confirms deleted files have no references; both builds pass.

**Done when:** script ✅ + builds green + report renders + old flow removed cleanly.

---

## Module Impact Summary (stays inside 5 modules)
| Module | What it gets | Untouched parts |
|---|---|---|
| **Customer** | "Confirmed" status + new status display, on-door return | login, browse, cart, checkout |
| **Warehouse** | Route Planning, Reconciliation, Daily Report pages | products, inventory, taxes, wallet |
| **Delivery** | Route Today, Load Verify, Stops, Stop Detail, Complete | wallet, earnings, profile, login |
| **Admin** | Route planning access, live monitor, daily report | approvals, users, finance, content |
| **Port** | nothing | everything |

## Full-day flow (one line)
Retailer orders by 8 PM → Warehouse/Admin plans routes by 10 PM → Driver accepts →
loads (4–6 AM) → delivers 10+ stops (6–10 AM) with confirm + pay + return + crates →
completes route → Warehouse reconciles → Daily report.
