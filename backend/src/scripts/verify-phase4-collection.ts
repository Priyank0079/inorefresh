/**
 * Phase 4 verification — Payment, Returns, Returnable Assets, Route Completion.
 *
 * Run:  npm run verify:phase4
 *
 * Through the REAL controllers (fake req/res):
 *  1. payment (Cash)        → stop.payment set + driver.cashCollected increased
 *  2. payment (UPI no ref)  → rejected (400)
 *  3. return without photo  → rejected (400); with photo → saved
 *  4. assets collected      → stop.assets + route ledger collected updated
 *  5. complete with pending → rejected (409); after all delivered → Completed
 * Cleans up all throwaway data.
 */
import mongoose from "mongoose";
import connectDB from "../config/db";
import Delivery from "../models/Delivery";
import Order from "../models/Order";
import "../models/OrderItem";
import DeliveryRoute from "../models/DeliveryRoute";
import RouteStop from "../models/RouteStop";
import ReturnableAsset from "../models/ReturnableAsset";
import * as ctrl from "../modules/delivery/controllers/deliveryRouteController";

const TAG = "PHASE4_TEST";
const ok = (m: string) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const fail = (m: string) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);

function invoke(handler: any, reqLike: any): Promise<{ statusCode: number; payload: any }> {
  return new Promise((resolve, reject) => {
    const req: any = { body: {}, params: {}, query: {}, user: {}, ...reqLike };
    let statusCode = 200;
    const res: any = {
      status(c: number) { statusCode = c; return res; },
      json(payload: any) { resolve({ statusCode, payload }); return res; },
    };
    const next = (err: any) => (err ? reject(err) : resolve({ statusCode, payload: null }));
    Promise.resolve(handler(req, res, next)).catch(reject);
  });
}

async function cleanup(driverId?: string) {
  const orderIds = await Order.find({ customerName: TAG }).distinct("_id");
  const routeIds = await DeliveryRoute.find({ "vehicle.vehicleNumber": "PHASE4-TEST" }).distinct("_id");
  await RouteStop.deleteMany({ $or: [{ order: { $in: orderIds } }, { route: { $in: routeIds } }] });
  await ReturnableAsset.deleteMany({ route: { $in: routeIds } });
  await DeliveryRoute.deleteMany({ _id: { $in: routeIds } });
  await Order.deleteMany({ customerName: TAG });
  if (driverId) await Delivery.findByIdAndDelete(driverId);
  await Delivery.deleteMany({ name: TAG });
}

async function main() {
  let passed = true;
  await connectDB();
  await cleanup();

  const rnd = Date.now().toString().slice(-7);
  let driverId = "";

  try {
    // ── Setup: driver + Out-For-Delivery route, stop1 Delivered, stop2 Delivered ──
    console.log("\n[setup] driver + active route + 2 delivered stops");
    const driver = await Delivery.create({
      name: TAG, mobile: `9${rnd.padStart(9, "0")}`.slice(0, 10),
      email: `phase4_${rnd}@test.com`, password: "test1234", status: "Active", cashCollected: 0,
    });
    driverId = String(driver._id);

    const mkOrder = async (n: number) =>
      Order.create({
        customer: new mongoose.Types.ObjectId(), customerName: TAG, customerPhone: "9000000000",
        deliveryAddress: { address: `Shop ${n}`, city: "TestCity", pincode: "400001" },
        subtotal: 1000, total: 1000, paymentMethod: "COD", status: "Delivered",
      });
    const o1 = await mkOrder(1);
    const o2 = await mkOrder(2);

    const route = await DeliveryRoute.create({
      date: new Date(), status: "Out For Delivery",
      vehicle: { vehicleNumber: "PHASE4-TEST", vehicleType: "Tempo" },
      driver: driver._id, totals: { orderCount: 2, totalWeight: 0, estimatedTimeMins: 30 },
      timeline: { plannedAt: new Date(), acceptedAt: new Date(), loadedAt: new Date(), dispatchedAt: new Date() },
    });
    const s1 = await RouteStop.create({ route: route._id, order: o1._id, sequence: 1, retailer: { name: "Shop 1", address: "A" }, status: "Delivered", deliveredAt: new Date() });
    const s2 = await RouteStop.create({ route: route._id, order: o2._id, sequence: 2, retailer: { name: "Shop 2", address: "B" }, status: "Delivered", deliveredAt: new Date() });
    route.stops = [s1._id, s2._id] as any;
    await route.save();
    ok("Seeded driver + Out-For-Delivery route + 2 delivered stops");

    const user = { userId: driverId, userType: "Delivery" };

    // ── 1. payment Cash ─────────────────────────────────────────────────
    console.log("\n[1] Cash payment");
    let r = await invoke(ctrl.recordPayment, { user, params: { stopId: String(s1._id) }, body: { method: "Cash", amount: 1000 } });
    if (r.statusCode !== 200) throw new Error(`payment status ${r.statusCode}: ${r.payload?.message}`);
    let drv = await Delivery.findById(driverId);
    if (drv?.cashCollected !== 1000) throw new Error(`cashCollected ${drv?.cashCollected}, expected 1000`);
    ok("Cash payment recorded + driver.cashCollected = 1000");

    // ── 2. UPI without ref rejected ─────────────────────────────────────
    console.log("\n[2] UPI without reference");
    r = await invoke(ctrl.recordPayment, { user, params: { stopId: String(s2._id) }, body: { method: "UPI", amount: 500 } });
    if (r.statusCode !== 400) throw new Error(`expected 400, got ${r.statusCode}`);
    ok("UPI without referenceNo rejected (400)");
    // valid UPI with ref
    r = await invoke(ctrl.recordPayment, { user, params: { stopId: String(s2._id) }, body: { method: "UPI", amount: 500, referenceNo: "UPI123" } });
    if (r.statusCode !== 200) throw new Error(`UPI w/ ref status ${r.statusCode}`);
    drv = await Delivery.findById(driverId);
    if (drv?.cashCollected !== 1000) throw new Error("UPI must NOT change cashCollected");
    ok("UPI w/ ref accepted; cashCollected unchanged (correct)");

    // ── 3. returns ──────────────────────────────────────────────────────
    console.log("\n[3] Return photo rule");
    r = await invoke(ctrl.recordReturn, { user, params: { stopId: String(s1._id) }, body: { reason: "Damaged" } });
    if (r.statusCode !== 400) throw new Error(`expected 400 (no photo), got ${r.statusCode}`);
    ok("Return without photo rejected (400)");
    r = await invoke(ctrl.recordReturn, { user, params: { stopId: String(s1._id) }, body: { reason: "Damaged", qtyKg: 2, photoUrl: "https://x/p.jpg", action: "Return to Warehouse" } });
    if (r.statusCode !== 200) throw new Error(`return status ${r.statusCode}`);
    const fs1 = await RouteStop.findById(s1._id);
    if ((fs1?.returns?.length || 0) !== 1) throw new Error("return not saved");
    ok("Return with photo saved");

    // ── 4. assets ───────────────────────────────────────────────────────
    console.log("\n[4] Returnable assets");
    r = await invoke(ctrl.recordAssets, { user, params: { stopId: String(s1._id) }, body: { type: "Fish Crate", qtyCollected: 3 } });
    if (r.statusCode !== 200) throw new Error(`assets status ${r.statusCode}`);
    await invoke(ctrl.recordAssets, { user, params: { stopId: String(s2._id) }, body: { type: "Fish Crate", qtyCollected: 2 } });
    const ledger = await ReturnableAsset.findOne({ route: route._id, type: "Fish Crate" });
    if (ledger?.collected !== 5) throw new Error(`ledger collected ${ledger?.collected}, expected 5`);
    ok("Asset collection rolled up to route ledger (collected=5)");

    // ── 5. complete route ───────────────────────────────────────────────
    console.log("\n[5] Complete route");
    // add a pending stop to prove completion is blocked
    const s3 = await RouteStop.create({ route: route._id, order: o1._id, sequence: 3, retailer: { name: "Shop 3", address: "C" }, status: "Pending" });
    r = await invoke(ctrl.completeRoute, { user, params: { id: String(route._id) }, body: {} });
    if (r.statusCode !== 409) throw new Error(`expected 409 with pending stop, got ${r.statusCode}`);
    ok("Completion blocked while a stop is pending (409)");
    await RouteStop.findByIdAndUpdate(s3._id, { status: "Failed", failureReason: "shop closed" });
    r = await invoke(ctrl.completeRoute, { user, params: { id: String(route._id) }, body: { distanceKm: 42 } });
    if (r.statusCode !== 200) throw new Error(`complete status ${r.statusCode}: ${r.payload?.message}`);
    const fresh = await DeliveryRoute.findById(route._id);
    if (fresh?.status !== "Completed" || fresh?.distanceKm !== 42) throw new Error("route not Completed with distance");
    ok(`Route Completed (delivered=${r.payload?.data?.deliveredStops}, distance=42km)`);
  } catch (e: any) {
    fail(e.message);
    passed = false;
  }

  await cleanup(driverId);
  ok("Cleaned up all throwaway data");

  await mongoose.disconnect();
  console.log("\n" + "=".repeat(48));
  console.log(passed ? "\x1b[32m\x1b[1m✅ PHASE 4 PASSED\x1b[0m" : "\x1b[31m\x1b[1m❌ PHASE 4 FAILED\x1b[0m");
  process.exit(passed ? 0 : 1);
}

main().catch((e) => {
  console.error("\x1b[31mScript error:\x1b[0m", e);
  process.exit(1);
});
