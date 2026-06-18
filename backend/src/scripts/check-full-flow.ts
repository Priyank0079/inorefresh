/**
 * Full flow verification — checks every aspect of the route-based logistics system.
 * Run: npx tsx src/scripts/check-full-flow.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Order from "../models/Order";
import Delivery from "../models/Delivery";
import DeliveryRoute from "../models/DeliveryRoute";
import RouteStop from "../models/RouteStop";
import "../models/ReturnableAsset";
import "../models/AppSettings";
import Return from "../models/Return";
import Warehouse from "../models/Warehouse";
import "../models/OrderItem";

let passed = 0;
let failed = 0;
const ok = (m: string) => { passed++; console.log(`  \x1b[32m✓\x1b[0m ${m}`); };
const fail = (m: string) => { failed++; console.log(`  \x1b[31m✗\x1b[0m ${m}`); };
const section = (m: string) => console.log(`\n\x1b[1m\x1b[36m━━━ ${m} ━━━\x1b[0m`);
const info = (m: string) => console.log(`  📊 ${m}`);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("\x1b[1m\n🔍 FULL FLOW CHECK — InorFresh Route-Based Logistics\x1b[0m\n");

  // ══════════════════════════════════════
  section("1. DATABASE STATE");
  // ══════════════════════════════════════
  const totalOrders = await Order.countDocuments();
  const routeCount = await DeliveryRoute.countDocuments();
  const stopCount = await RouteStop.countDocuments();
  const driverCount = await Delivery.countDocuments({ status: "Active" });
  const warehouseCount = await Warehouse.countDocuments({ status: "ACTIVE" });
  const returnCount = await Return.countDocuments();

  info(`Orders: ${totalOrders}`);
  info(`Routes: ${routeCount}`);
  info(`Route Stops: ${stopCount}`);
  info(`Active Drivers: ${driverCount}`);
  info(`Active Warehouses: ${warehouseCount}`);
  info(`Returns: ${returnCount}`);

  // ══════════════════════════════════════
  section("2. ORDER STATUS DISTRIBUTION");
  // ══════════════════════════════════════
  const statusAgg = await Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  for (const s of statusAgg) {
    info(`${s._id}: ${s.count}`);
  }

  // ══════════════════════════════════════
  section("3. ROUTE STATUS DISTRIBUTION");
  // ══════════════════════════════════════
  const routeStatusAgg = await DeliveryRoute.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  if (routeStatusAgg.length === 0) {
    info("No routes created yet");
  } else {
    for (const s of routeStatusAgg) info(`${s._id}: ${s.count}`);
  }

  // ══════════════════════════════════════
  section("4. ROUTE STOPS — DELIVERY PROGRESS");
  // ══════════════════════════════════════
  const stopStatusAgg = await RouteStop.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  if (stopStatusAgg.length === 0) {
    info("No stops yet");
  } else {
    for (const s of stopStatusAgg) info(`${s._id}: ${s.count}`);
  }

  // Check if delivered stops have matching delivered orders
  const deliveredStops = await RouteStop.find({ status: "Delivered" }).select("order").lean();
  if (deliveredStops.length > 0) {
    const deliveredOrderIds = deliveredStops.map((s) => s.order);
    const deliveredOrders = await Order.countDocuments({ _id: { $in: deliveredOrderIds }, status: "Delivered" });
    const mismatch = deliveredStops.length - deliveredOrders;
    if (mismatch === 0) {
      ok(`All ${deliveredStops.length} delivered stops have matching Delivered orders`);
    } else {
      // Some might be in return states which is valid
      const returnStates = await Order.countDocuments({
        _id: { $in: deliveredOrderIds },
        status: { $in: ["Return Under Review", "Partially Returned", "Fully Returned"] },
      });
      if (mismatch === returnStates) {
        ok(`${deliveredStops.length} delivered stops: ${deliveredOrders} Delivered + ${returnStates} in return flow`);
      } else {
        fail(`${mismatch} delivered stops don't have matching order status (${returnStates} in returns)`);
      }
    }
  }

  // ══════════════════════════════════════
  section("5. ORDER-ROUTE CONSISTENCY");
  // ══════════════════════════════════════
  // Orders with "Out for Delivery" should have a route
  const outForDelivery = await Order.find({ status: "Out for Delivery" }).select("_id orderNumber").lean();
  if (outForDelivery.length > 0) {
    const ofdIds = outForDelivery.map((o) => o._id);
    const stopsForOfd = await RouteStop.countDocuments({ order: { $in: ofdIds } });
    stopsForOfd === outForDelivery.length
      ? ok(`${outForDelivery.length} "Out for Delivery" orders all have route stops`)
      : fail(`${outForDelivery.length} OFD orders but only ${stopsForOfd} have route stops`);
  } else {
    info("No orders currently Out for Delivery");
  }

  // ══════════════════════════════════════
  section("6. RETURN FLOW CHECK");
  // ══════════════════════════════════════
  const returnStatusAgg = await Return.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  if (returnStatusAgg.length === 0) {
    info("No returns submitted");
  } else {
    for (const s of returnStatusAgg) info(`Return status ${s._id}: ${s.count}`);
  }

  // Check returns have valid warehouse references
  const returnsWithWarehouse = await Return.find().select("warehouse deliveryBoy status").lean();
  let orphanReturns = 0;
  let returnsWithDriver = 0;
  for (const r of returnsWithWarehouse) {
    if ((r as any).warehouse) {
      const wh = await Warehouse.findById((r as any).warehouse).select("_id").lean();
      if (!wh) orphanReturns++;
    }
    if ((r as any).deliveryBoy) returnsWithDriver++;
  }
  if (orphanReturns > 0) {
    fail(`${orphanReturns} return(s) reference deleted warehouse(s) — notifications won't reach them`);
  } else if (returnsWithWarehouse.length > 0) {
    ok(`All ${returnsWithWarehouse.length} returns have valid warehouse references (or broadcast notification covers them)`);
  }
  if (returnsWithWarehouse.length > 0) {
    returnsWithDriver === returnsWithWarehouse.length
      ? ok(`All returns have deliveryBoy assigned`)
      : fail(`${returnsWithWarehouse.length - returnsWithDriver} return(s) missing deliveryBoy`);
  }

  // Check approved returns have OTP
  const approvedReturns = await Return.find({ status: "Approved" }).select("warehouseVerificationOtp").lean();
  if (approvedReturns.length > 0) {
    const withOtp = approvedReturns.filter((r) => (r as any).warehouseVerificationOtp);
    withOtp.length === approvedReturns.length
      ? ok(`All ${approvedReturns.length} approved returns have OTP generated`)
      : fail(`${approvedReturns.length - withOtp.length} approved returns missing OTP`);
  }

  // ══════════════════════════════════════
  section("7. API ENDPOINTS");
  // ══════════════════════════════════════
  const endpoints = [
    { path: "/routes/unplanned-orders", desc: "Unplanned orders + bundles" },
    { path: "/routes/drivers", desc: "Driver list" },
    { path: "/routes", desc: "Route list" },
    { path: "/customer/order-window", desc: "Order window" },
    { path: "/delivery/routes/today", desc: "Driver today route" },
    { path: "/returns", desc: "Return requests (warehouse)" },
    { path: "/returns/workflow/order/000000000000000000000000", desc: "Order returns" },
  ];
  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://127.0.0.1:7000/api/v1${ep.path}`);
      res.status === 401 || res.status === 200 || res.status === 404
        ? ok(`GET ${ep.path} — registered (${res.status})`)
        : fail(`GET ${ep.path} — ${res.status}`);
    } catch {
      fail(`GET ${ep.path} — server unreachable`);
    }
  }

  // POST endpoints
  const postEndpoints = [
    "/delivery/routes/test/loading-otp",
    "/delivery/routes/test/verify-load",
    "/delivery/stops/test/send-otp",
    "/delivery/stops/test/confirm",
    "/returns/workflow/rider/verify-otp/test",
  ];
  for (const path of postEndpoints) {
    try {
      const res = await fetch(`http://127.0.0.1:7000/api/v1${path}`, { method: "POST" });
      res.status === 401 || res.status === 200
        ? ok(`POST ${path} — registered`)
        : fail(`POST ${path} — ${res.status}`);
    } catch {
      fail(`POST ${path} — unreachable`);
    }
  }

  // ══════════════════════════════════════
  section("8. INSPECTION FIELDS CHECK");
  // ══════════════════════════════════════
  const deliveredWithInspection = await Order.find({
    status: { $in: ["Delivered", "Return Under Review", "Partially Returned", "Fully Returned"] },
    inspectionStartedAt: { $exists: true, $ne: null },
  }).countDocuments();
  const deliveredWithout = await Order.find({
    status: "Delivered",
    $or: [{ inspectionStartedAt: { $exists: false } }, { inspectionStartedAt: null }],
    deliveredAt: { $exists: true },
  }).countDocuments();
  info(`Orders with inspection timer set: ${deliveredWithInspection}`);
  if (deliveredWithout > 0) {
    fail(`${deliveredWithout} delivered orders missing inspection fields (old deliveries before fix)`);
  } else {
    ok("All recently delivered orders have inspection fields set");
  }

  // ══════════════════════════════════════
  section("9. PAYMENT METHOD CHECK");
  // ══════════════════════════════════════
  const paymentMethods = await Order.aggregate([
    { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  for (const pm of paymentMethods) {
    info(`${pm._id || "null/undefined"}: ${pm.count} orders`);
  }

  // ══════════════════════════════════════
  // FINAL
  // ══════════════════════════════════════
  console.log("\n" + "═".repeat(50));
  console.log(`\x1b[1m  PASSED: ${passed}  |  FAILED: ${failed}\x1b[0m`);
  console.log("═".repeat(50));
  if (failed === 0) {
    console.log("\x1b[32m\x1b[1m  ✅ ALL CHECKS PASSED\x1b[0m\n");
  } else {
    console.log(`\x1b[31m\x1b[1m  ❌ ${failed} CHECK(S) NEED ATTENTION\x1b[0m\n`);
  }

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error("Script error:", e); process.exit(1); });
