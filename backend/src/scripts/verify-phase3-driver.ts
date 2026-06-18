/**
 * Phase 3 verification — Driver Route Execution.
 *
 * Run:  npm run verify:phase3
 *
 * Simulates one driver day through the REAL controllers (fake req/res):
 *  1. accept route        → Accepted + driver.currentRoute set
 *  2. verify-load         → Loaded + ReturnableAsset issued recorded
 *  3. start               → Out For Delivery + dispatchedAt + orders updated
 *  4. arrived             → stop Arrived + gps
 *  5. deliver             → returns order items
 *  6. confirm (wrong OTP) → rejected (400)
 *  7. confirm (right OTP)  → stop+order Delivered, confirmationMethod=OTP
 *  8. confirm (Signature)  → second stop Delivered via proof
 *  9. timeline timestamps are in order
 * Cleans up all throwaway data.
 */
import mongoose from "mongoose";
import connectDB from "../config/db";
import Delivery from "../models/Delivery";
import Order from "../models/Order";
import "../models/OrderItem"; // ensure OrderItem is registered for populate("items")
import DeliveryRoute from "../models/DeliveryRoute";
import RouteStop from "../models/RouteStop";
import ReturnableAsset from "../models/ReturnableAsset";
import * as ctrl from "../modules/delivery/controllers/deliveryRouteController";

const TAG = "PHASE3_TEST";
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
  const routeIds = await DeliveryRoute.find({ "vehicle.vehicleNumber": "PHASE3-TEST" }).distinct("_id");
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
    // ── Setup ───────────────────────────────────────────────────────────
    console.log("\n[setup] driver + assigned route + 2 stops");
    const driver = await Delivery.create({
      name: TAG,
      mobile: `9${rnd.padStart(9, "0")}`.slice(0, 10),
      email: `phase3_${rnd}@test.com`,
      password: "test1234",
      status: "Active",
    });
    driverId = String(driver._id);

    const mkOrder = async (n: number) =>
      Order.create({
        customer: new mongoose.Types.ObjectId(),
        customerName: TAG,
        customerPhone: "9000000000",
        deliveryAddress: { address: `Shop ${n}`, city: "TestCity", pincode: "400001" },
        subtotal: 1000, total: 1000, paymentMethod: "COD",
        status: "Confirmed", deliveryOtp: "1234",
      });
    const o1 = await mkOrder(1);
    const o2 = await mkOrder(2);

    const route = await DeliveryRoute.create({
      date: new Date(),
      status: "Assigned",
      vehicle: { vehicleNumber: "PHASE3-TEST", vehicleType: "Tempo" },
      driver: driver._id,
      totals: { orderCount: 2, totalWeight: 0, estimatedTimeMins: 30 },
      timeline: { plannedAt: new Date(), assignedAt: new Date() },
    });
    const s1 = await RouteStop.create({ route: route._id, order: o1._id, sequence: 1, retailer: { name: "Shop 1", address: "A" }, status: "Pending" });
    const s2 = await RouteStop.create({ route: route._id, order: o2._id, sequence: 2, retailer: { name: "Shop 2", address: "B" }, status: "Pending" });
    route.stops = [s1._id, s2._id] as any;
    await route.save();
    ok("Seeded driver, route (Assigned), 2 stops");

    const user = { userId: driverId, userType: "Delivery" };
    const rid = String(route._id);

    // ── 1. accept ───────────────────────────────────────────────────────
    console.log("\n[1] Accept route");
    let r = await invoke(ctrl.acceptRoute, { user, params: { id: rid } });
    if (r.statusCode !== 200) throw new Error(`accept status ${r.statusCode}: ${r.payload?.message}`);
    let fresh = await DeliveryRoute.findById(rid);
    const drv = await Delivery.findById(driverId);
    if (fresh?.status !== "Accepted") throw new Error("route not Accepted");
    if (String(drv?.currentRoute) !== rid) throw new Error("driver.currentRoute not set");
    ok("Route Accepted + driver.currentRoute set");

    // ── 2. verify-load ──────────────────────────────────────────────────
    console.log("\n[2] Verify load");
    r = await invoke(ctrl.verifyLoad, { user, params: { id: rid }, body: { assets: [{ type: "Fish Crate", qty: 5 }] } });
    if (r.statusCode !== 200) throw new Error(`verify-load status ${r.statusCode}`);
    fresh = await DeliveryRoute.findById(rid);
    const asset = await ReturnableAsset.findOne({ route: rid, type: "Fish Crate" });
    if (fresh?.status !== "Loaded") throw new Error("route not Loaded");
    if (asset?.issued !== 5) throw new Error(`asset issued ${asset?.issued}, expected 5`);
    ok("Route Loaded + ReturnableAsset issued=5");

    // ── 3. start ────────────────────────────────────────────────────────
    console.log("\n[3] Start route");
    r = await invoke(ctrl.startRoute, { user, params: { id: rid } });
    if (r.statusCode !== 200) throw new Error(`start status ${r.statusCode}`);
    fresh = await DeliveryRoute.findById(rid);
    const ord1 = await Order.findById(o1._id);
    if (fresh?.status !== "Out For Delivery") throw new Error("route not Out For Delivery");
    if (!fresh?.timeline?.dispatchedAt) throw new Error("dispatchedAt not set");
    if (ord1?.status !== "Out for Delivery") throw new Error("order not moved to Out for Delivery");
    ok("Route Out For Delivery + dispatchedAt + orders updated");

    // ── 4. arrived ──────────────────────────────────────────────────────
    console.log("\n[4] Arrive at stop 1");
    r = await invoke(ctrl.arriveAtStop, { user, params: { stopId: String(s1._id) }, body: { latitude: 19.07, longitude: 72.87 } });
    if (r.statusCode !== 200) throw new Error(`arrived status ${r.statusCode}`);
    let fs1 = await RouteStop.findById(s1._id);
    if (fs1?.status !== "Arrived" || !fs1?.arrivedAt) throw new Error("stop not Arrived");
    ok("Stop 1 Arrived + GPS + time recorded");

    // ── 5. deliver ──────────────────────────────────────────────────────
    console.log("\n[5] Deliver checkpoint");
    r = await invoke(ctrl.deliverStop, { user, params: { stopId: String(s1._id) } });
    if (r.statusCode !== 200) throw new Error(`deliver status ${r.statusCode}`);
    ok(`Deliver returns items (orderNumber=${r.payload?.data?.orderNumber})`);

    // ── 6. confirm wrong OTP ────────────────────────────────────────────
    console.log("\n[6] Confirm with wrong OTP");
    r = await invoke(ctrl.confirmStop, { user, params: { stopId: String(s1._id) }, body: { method: "OTP", otp: "0000" } });
    if (r.statusCode !== 400) throw new Error(`expected 400, got ${r.statusCode}`);
    ok("Wrong OTP rejected (400)");

    // ── 7. confirm right OTP ────────────────────────────────────────────
    console.log("\n[7] Confirm with correct OTP");
    r = await invoke(ctrl.confirmStop, { user, params: { stopId: String(s1._id) }, body: { method: "OTP", otp: "1234" } });
    if (r.statusCode !== 200) throw new Error(`confirm status ${r.statusCode}: ${r.payload?.message}`);
    fs1 = await RouteStop.findById(s1._id);
    const od1 = await Order.findById(o1._id);
    if (fs1?.status !== "Delivered") throw new Error("stop1 not Delivered");
    if (od1?.status !== "Delivered" || od1?.confirmationMethod !== "OTP") throw new Error("order1 not Delivered via OTP");
    ok("Stop 1 + Order 1 Delivered (method=OTP)");

    // ── 8. confirm Signature on stop 2 ──────────────────────────────────
    console.log("\n[8] Stop 2 via Signature");
    await invoke(ctrl.arriveAtStop, { user, params: { stopId: String(s2._id) }, body: {} });
    r = await invoke(ctrl.confirmStop, { user, params: { stopId: String(s2._id) }, body: { method: "Signature", proofUrl: "https://x/sig.png" } });
    if (r.statusCode !== 200) throw new Error(`sig confirm status ${r.statusCode}`);
    const od2 = await Order.findById(o2._id);
    if (od2?.confirmationMethod !== "Signature") throw new Error("order2 not confirmed via Signature");
    ok("Stop 2 + Order 2 Delivered (method=Signature)");

    // ── 9. timeline order ───────────────────────────────────────────────
    console.log("\n[9] Timeline ordering");
    fresh = await DeliveryRoute.findById(rid);
    const t = fresh!.timeline;
    if (!(t.acceptedAt! <= t.loadedAt! && t.loadedAt! <= t.dispatchedAt!))
      throw new Error("timeline timestamps out of order");
    ok("Timeline: accepted ≤ loaded ≤ dispatched");
  } catch (e: any) {
    fail(e.message);
    passed = false;
  }

  await cleanup(driverId);
  ok("Cleaned up all throwaway data");

  await mongoose.disconnect();
  console.log("\n" + "=".repeat(48));
  console.log(passed ? "\x1b[32m\x1b[1m✅ PHASE 3 PASSED\x1b[0m" : "\x1b[31m\x1b[1m❌ PHASE 3 FAILED\x1b[0m");
  process.exit(passed ? 0 : 1);
}

main().catch((e) => {
  console.error("\x1b[31mScript error:\x1b[0m", e);
  process.exit(1);
});
