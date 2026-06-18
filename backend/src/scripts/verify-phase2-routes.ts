/**
 * Phase 2 verification — Route Planning (Warehouse + Admin).
 *
 * Run:  npm run verify:phase2
 *
 * Invokes the REAL routeController functions (via a fake req/res) so the
 * actual business rules are exercised:
 *  1. Unplanned-orders endpoint returns confirmed orders grouped by area.
 *  2. Creating a route with < min orders is rejected (400).
 *  3. Creating a route with >= min orders succeeds (201) with correct stops.
 *  4. Routes list includes the new route.
 *  5. Re-using already-routed orders is rejected (409).
 * Cleans up all throwaway data.
 */
import mongoose from "mongoose";
import connectDB from "../config/db";
import Order from "../models/Order";
import DeliveryRoute from "../models/DeliveryRoute";
import RouteStop from "../models/RouteStop";
import * as routeController from "../modules/warehouse/controllers/routeController";

const TAG = "PHASE2_TEST";
const ok = (m: string) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const fail = (m: string) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);

/** Call an asyncHandler-wrapped controller and capture the response. */
function invoke(
  handler: any,
  reqLike: any,
): Promise<{ statusCode: number; payload: any }> {
  return new Promise((resolve, reject) => {
    const req: any = { body: {}, params: {}, query: {}, user: {}, ...reqLike };
    let statusCode = 200;
    const res: any = {
      status(c: number) {
        statusCode = c;
        return res;
      },
      json(payload: any) {
        resolve({ statusCode, payload });
        return res;
      },
    };
    const next = (err: any) => (err ? reject(err) : resolve({ statusCode, payload: null }));
    Promise.resolve(handler(req, res, next)).catch(reject);
  });
}

async function cleanup() {
  const orders = await Order.find({ customerName: TAG }).distinct("_id");
  await RouteStop.deleteMany({ order: { $in: orders } });
  const routeIds = await DeliveryRoute.find({ "vehicle.vehicleNumber": "PHASE2-TEST-01" }).distinct("_id");
  await RouteStop.deleteMany({ route: { $in: routeIds } });
  await DeliveryRoute.deleteMany({ _id: { $in: routeIds } });
  await Order.deleteMany({ customerName: TAG });
}

async function main() {
  let passed = true;
  await connectDB();
  await cleanup(); // clear any leftovers from a previous failed run

  const user = { userId: new mongoose.Types.ObjectId().toString(), userType: "Warehouse" };

  // ── Seed 10 confirmed orders across 2 areas ─────────────────────────────
  console.log("\n[setup] Seeding 10 confirmed test orders");
  const made: string[] = [];
  try {
    for (let i = 0; i < 10; i++) {
      const o = await Order.create({
        customer: new mongoose.Types.ObjectId(),
        customerName: TAG,
        customerPhone: "9000000000",
        deliveryAddress: {
          address: `Shop ${i + 1}`,
          city: i < 6 ? "TestCityA" : "TestCityB",
          pincode: "400001",
        },
        subtotal: 1000,
        total: 1000,
        paymentMethod: "COD",
        status: "Confirmed",
      });
      made.push(String(o._id));
    }
    ok(`Seeded ${made.length} confirmed orders (TestCityA x6, TestCityB x4)`);
  } catch (e: any) {
    fail(`seeding failed: ${e.message}`);
    await cleanup();
    await mongoose.disconnect();
    process.exit(1);
  }

  // ── 1. Unplanned orders grouped ─────────────────────────────────────────
  console.log("\n[1] Unplanned orders endpoint");
  try {
    const r = await invoke(routeController.getUnplannedOrders, { user });
    const groups = r.payload?.data?.groups || [];
    const ours = groups.filter((g: any) => ["TestCityA", "TestCityB"].includes(g.area));
    if (r.statusCode !== 200) throw new Error(`status ${r.statusCode}`);
    if (ours.length < 2) throw new Error("expected our 2 areas in groups");
    ok(`Returned grouped unplanned orders (found areas: ${ours.map((g: any) => `${g.area}:${g.count}`).join(", ")})`);
  } catch (e: any) {
    fail(e.message);
    passed = false;
  }

  // ── 2. < min orders rejected ────────────────────────────────────────────
  console.log("\n[2] Min-orders rule");
  try {
    const r = await invoke(routeController.createRoute, {
      user,
      body: { vehicle: { vehicleNumber: "PHASE2-TEST-01" }, orderIds: made.slice(0, 5) },
    });
    if (r.statusCode !== 400) throw new Error(`expected 400, got ${r.statusCode}`);
    ok(`Route with 5 orders rejected (400): "${r.payload?.message}"`);
  } catch (e: any) {
    fail(e.message);
    passed = false;
  }

  // ── 3. >= min orders succeeds ───────────────────────────────────────────
  console.log("\n[3] Create valid route");
  let createdRouteNo = "";
  try {
    const r = await invoke(routeController.createRoute, {
      user,
      body: { vehicle: { vehicleNumber: "PHASE2-TEST-01", vehicleType: "Tempo" }, orderIds: made },
    });
    if (r.statusCode !== 201) throw new Error(`expected 201, got ${r.statusCode} (${r.payload?.message})`);
    if (r.payload?.data?.stops !== 10) throw new Error(`expected 10 stops, got ${r.payload?.data?.stops}`);
    createdRouteNo = r.payload?.data?.routeNumber;
    ok(`Route created (${createdRouteNo}) with 10 stops`);

    const stopCount = await RouteStop.countDocuments({ route: r.payload.data.id });
    if (stopCount !== 10) throw new Error(`DB has ${stopCount} stops, expected 10`);
    ok("10 RouteStop docs persisted");
  } catch (e: any) {
    fail(e.message);
    passed = false;
  }

  // ── 4. List routes includes it ──────────────────────────────────────────
  console.log("\n[4] Routes list");
  try {
    const r = await invoke(routeController.getRoutes, { user, query: {} });
    const found = (r.payload?.data || []).some((x: any) => x.routeNumber === createdRouteNo);
    if (!found) throw new Error("created route not in list");
    ok("Created route appears in routes list");
  } catch (e: any) {
    fail(e.message);
    passed = false;
  }

  // ── 5. Duplicate orders rejected ────────────────────────────────────────
  console.log("\n[5] Duplicate-order guard");
  try {
    const r = await invoke(routeController.createRoute, {
      user,
      body: { vehicle: { vehicleNumber: "PHASE2-TEST-01" }, orderIds: made },
    });
    if (r.statusCode !== 409) throw new Error(`expected 409, got ${r.statusCode}`);
    ok(`Re-using routed orders rejected (409): "${r.payload?.message}"`);
  } catch (e: any) {
    fail(e.message);
    passed = false;
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────
  await cleanup();
  ok("Cleaned up all throwaway data");

  await mongoose.disconnect();
  console.log("\n" + "=".repeat(48));
  if (passed) {
    console.log("\x1b[32m\x1b[1m✅ PHASE 2 PASSED\x1b[0m");
    process.exit(0);
  } else {
    console.log("\x1b[31m\x1b[1m❌ PHASE 2 FAILED\x1b[0m");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("\x1b[31mScript error:\x1b[0m", e);
  process.exit(1);
});
