/**
 * FINAL END-TO-END SYSTEM CHECK
 * Verifies every component of the InorFresh route-based logistics system.
 * Run: npx tsx src/scripts/final-system-check.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Order from "../models/Order";
import Delivery from "../models/Delivery";
import DeliveryRoute from "../models/DeliveryRoute";
import RouteStop from "../models/RouteStop";
import "../models/ReturnableAsset";
import AppSettings from "../models/AppSettings";
import Return from "../models/Return";
import Warehouse from "../models/Warehouse";
import Product from "../models/Product";
import Notification from "../models/Notification";
import "../models/OrderItem";
import { buildBundles } from "../modules/warehouse/controllers/routeController";
import { getOrderWindow } from "../utils/orderWindow";
import { computeOrderWeights } from "../utils/orderWeight";

let passed = 0;
let failed = 0;
let warnings = 0;
const ok = (m: string) => { passed++; console.log(`  \x1b[32m✓\x1b[0m ${m}`); };
const fail = (m: string) => { failed++; console.log(`  \x1b[31m✗\x1b[0m ${m}`); };
const warn = (m: string) => { warnings++; console.log(`  \x1b[33m⚠\x1b[0m ${m}`); };
const section = (m: string) => console.log(`\n\x1b[1m\x1b[36m━━━ ${m} ━━━\x1b[0m`);
const info = (m: string) => console.log(`  📊 ${m}`);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("\x1b[1m\n🔍 FINAL END-TO-END SYSTEM CHECK\x1b[0m\n");

  // ══════════════════════════════════════
  section("1. MODELS & SCHEMA");
  // ══════════════════════════════════════
  const models = mongoose.modelNames();
  for (const name of ["DeliveryRoute", "RouteStop", "ReturnableAsset", "Order", "Delivery", "Product", "Warehouse", "Return", "Notification"]) {
    models.includes(name) ? ok(`${name} registered`) : fail(`${name} NOT registered`);
  }

  // DeliveryRoute has routeName field
  const routeSchema = DeliveryRoute.schema.paths;
  routeSchema["routeName"] ? ok("DeliveryRoute.routeName field exists") : fail("DeliveryRoute.routeName missing");
  routeSchema["loadingOtp"] ? ok("DeliveryRoute.loadingOtp field exists") : fail("DeliveryRoute.loadingOtp missing");

  // Order has new fields
  const orderSchema = Order.schema.paths;
  orderSchema["confirmationMethod"] ? ok("Order.confirmationMethod exists") : fail("Order.confirmationMethod missing");
  (orderSchema["status"] as any)?.enumValues?.includes("Confirmed") ? ok("Order status has 'Confirmed'") : fail("Order status missing 'Confirmed'");

  // Delivery has new fields
  const deliverySchema = Delivery.schema.paths;
  deliverySchema["currentRoute"] ? ok("Delivery.currentRoute exists") : fail("missing");
  deliverySchema["isPartner"] ? ok("Delivery.isPartner exists") : fail("missing");

  // AppSettings has logistics config
  const settingsSchema = AppSettings.schema.paths;
  for (const f of ["orderCutOffTime", "orderOpenTime", "orderCutOffEnabled", "minOrdersPerRoute"]) {
    settingsSchema[f] ? ok(`AppSettings.${f}`) : fail(`AppSettings.${f} missing`);
  }

  // ══════════════════════════════════════
  section("2. ORDER WINDOW (Cut-off)");
  // ══════════════════════════════════════
  const mockSettings = { orderCutOffEnabled: true, orderOpenTime: "06:00", orderCutOffTime: "20:00" };
  const insideResult = getOrderWindow(mockSettings as any, new Date("2026-06-18T04:30:00Z"));
  insideResult.open ? ok("Window OPEN at 10:00 IST") : fail("Should be OPEN");
  const outsideResult = getOrderWindow(mockSettings as any, new Date("2026-06-18T15:30:00Z"));
  !outsideResult.open ? ok("Window CLOSED at 21:00 IST") : fail("Should be CLOSED");
  const disabledResult = getOrderWindow({ ...mockSettings, orderCutOffEnabled: false } as any, new Date("2026-06-18T15:30:00Z"));
  disabledResult.open ? ok("Window OPEN when disabled") : fail("Should be OPEN when disabled");

  // ══════════════════════════════════════
  section("3. ORDER BUNDLING");
  // ══════════════════════════════════════
  const usedOrderIds = await RouteStop.find().distinct("order");
  const unplannedOrders = await Order.find({
    status: { $in: ["Received", "Confirmed", "Accepted", "Pending", "Processed"] },
    _id: { $nin: usedOrderIds },
  }).select("orderNumber deliveryAddress orderDate").sort({ orderDate: -1 }).lean();
  info(`Unplanned orders: ${unplannedOrders.length}`);

  if (unplannedOrders.length > 0) {
    const bundles = buildBundles(unplannedOrders);
    bundles.length > 0 ? ok(`${bundles.length} bundles created`) : warn("No bundles (all orders may lack coordinates)");
    const over = bundles.filter((b: any) => b.count > 10);
    over.length === 0 ? ok("No bundle exceeds 10") : fail(`${over.length} bundles exceed 10`);
  }

  // ══════════════════════════════════════
  section("4. WEIGHT COMPUTATION");
  // ══════════════════════════════════════
  const sampleOrder = await Order.findOne().select("_id").lean();
  if (sampleOrder) {
    const weights = await computeOrderWeights([String(sampleOrder._id)]);
    const w = weights.get(String(sampleOrder._id)) || 0;
    w > 0 ? ok(`Weight computed: ${w} kg (product.weight or 1kg fallback)`) : warn(`Weight is 0 — check product data`);
  }

  // ══════════════════════════════════════
  section("5. API ENDPOINTS (HTTP)");
  // ══════════════════════════════════════
  const getEndpoints = [
    "/routes/unplanned-orders",
    "/routes/drivers",
    "/routes",
    "/routes/live-tracking",
    "/customer/order-window",
    "/delivery/routes/today",
    "/returns",
    "/warehouse/stock-overview",
  ];
  for (const path of getEndpoints) {
    try {
      const res = await fetch(`http://127.0.0.1:7000/api/v1${path}`);
      [200, 401, 403].includes(res.status) ? ok(`GET ${path} (${res.status})`) : fail(`GET ${path} → ${res.status}`);
    } catch { fail(`GET ${path} — unreachable`); }
  }

  const postEndpoints = [
    "/delivery/routes/test/loading-otp",
    "/delivery/routes/test/verify-load",
    "/delivery/routes/test/start",
    "/delivery/stops/test/arrived",
    "/delivery/stops/test/send-otp",
    "/delivery/stops/test/confirm",
    "/delivery/stops/test/payment",
    "/delivery/stops/test/assets",
    "/delivery/routes/test/complete",
    "/returns/workflow/rider/verify-otp/test",
    "/returns/workflow/rider/send-otp/test",
  ];
  for (const path of postEndpoints) {
    try {
      const res = await fetch(`http://127.0.0.1:7000/api/v1${path}`, { method: "POST" });
      [200, 401, 403].includes(res.status) ? ok(`POST ${path}`) : fail(`POST ${path} → ${res.status}`);
    } catch { fail(`POST ${path} — unreachable`); }
  }

  // ══════════════════════════════════════
  section("6. FRONTEND PAGES");
  // ══════════════════════════════════════
  const fs = require("fs");
  const path = require("path");
  const PROJECT_ROOT = path.join(__dirname, "../../..");
  const pages = [
    "frontend/src/modules/delivery/pages/DriverRouteToday.tsx",
    "frontend/src/modules/delivery/pages/DriverLoadingVerify.tsx",
    "frontend/src/modules/delivery/pages/DriverRouteStops.tsx",
    "frontend/src/modules/delivery/pages/DriverStopDetail.tsx",
    "frontend/src/modules/delivery/pages/DriverRouteComplete.tsx",
    "frontend/src/modules/warehouse/pages/WarehouseRoutePlanning.tsx",
    "frontend/src/modules/warehouse/pages/WarehouseLiveTracking.tsx",
    "frontend/src/modules/warehouse/pages/WarehouseStockOverview.tsx",
    "frontend/src/services/api/routeService.ts",
    "frontend/src/services/api/delivery/driverRouteService.ts",
  ];
  for (const f of pages) {
    fs.existsSync(path.join(PROJECT_ROOT, f)) ? ok(f.split("/").pop()!) : fail(`${f} MISSING`);
  }

  // ══════════════════════════════════════
  section("7. FRONTEND ROUTES");
  // ══════════════════════════════════════
  const deliveryRoutesSrc = fs.readFileSync(path.join(PROJECT_ROOT, "frontend/src/modules/delivery/DeliveryRoutes.tsx"), "utf8");
  for (const r of ["route/today", "route/:id/load", "route/:id/stops", "stop/:stopId"]) {
    deliveryRoutesSrc.includes(r) ? ok(`Delivery: ${r}`) : fail(`Missing: ${r}`);
  }
  const warehouseRoutesSrc = fs.readFileSync(path.join(PROJECT_ROOT, "frontend/src/modules/warehouse/WarehouseRoutes.tsx"), "utf8");
  for (const r of ["route-planning", "live-tracking", "stock-overview"]) {
    warehouseRoutesSrc.includes(r) ? ok(`Warehouse: ${r}`) : fail(`Missing: ${r}`);
  }

  // ══════════════════════════════════════
  section("8. SIDEBAR NAVIGATION");
  // ══════════════════════════════════════
  const whSidebar = fs.readFileSync(path.join(PROJECT_ROOT, "frontend/src/modules/warehouse/components/WarehouseSidebar.tsx"), "utf8");
  for (const item of ["Route Planning", "Live Delivery", "Stock Overview"]) {
    whSidebar.includes(item) ? ok(`Sidebar: ${item}`) : fail(`Sidebar missing: ${item}`);
  }
  const deliveryNav = fs.readFileSync(path.join(PROJECT_ROOT, "frontend/src/modules/delivery/components/DeliveryBottomNav.tsx"), "utf8");
  deliveryNav.includes("Route") ? ok("Delivery nav: Route tab") : fail("Missing Route tab");

  // ══════════════════════════════════════
  section("9. OLD FLOW RETIREMENT");
  // ══════════════════════════════════════
  const notifySrc = fs.readFileSync(path.join(PROJECT_ROOT, "backend/src/services/orderNotificationService.ts"), "utf8");
  notifySrc.includes("LEGACY_ONDEMAND_NOTIFY") ? ok("orderNotificationService guarded") : fail("NOT guarded");

  const deliveryLayoutSrc = fs.readFileSync(path.join(PROJECT_ROOT, "frontend/src/modules/delivery/components/DeliveryLayout.tsx"), "utf8");
  !deliveryLayoutSrc.includes("import OrderNotificationCard") ? ok("OrderNotificationCard removed from DeliveryLayout") : fail("Still imported");

  // ══════════════════════════════════════
  section("10. AI VOICE REMOVED");
  // ══════════════════════════════════════
  const notifCtx = fs.readFileSync(path.join(PROJECT_ROOT, "frontend/src/context/NotificationContext.tsx"), "utf8");
  !notifCtx.includes("speechSynthesis.speak") ? ok("AI voice (speechSynthesis) removed") : fail("speechSynthesis still present");

  // ══════════════════════════════════════
  section("11. NOTIFICATION SYSTEM");
  // ══════════════════════════════════════
  // Check no duplicate FCM sends
  const otpService = fs.readFileSync(path.join(PROJECT_ROOT, "backend/src/services/deliveryOtpService.ts"), "utf8");
  const fcmCallsInOtp = (otpService.match(/sendNotificationToUser/g) || []).length;
  fcmCallsInOtp === 0 ? ok("deliveryOtpService: no duplicate FCM (single sendNotification)") : fail(`${fcmCallsInOtp} direct FCM calls found`);

  const routeCtrl = fs.readFileSync(path.join(PROJECT_ROOT, "backend/src/modules/delivery/controllers/deliveryRouteController.ts"), "utf8");
  const fcmCallsInRoute = (routeCtrl.match(/sendNotificationToUser/g) || []).length;
  fcmCallsInRoute === 0 ? ok("deliveryRouteController: no duplicate FCM") : fail(`${fcmCallsInRoute} direct FCM calls`);

  // Service worker has urgent types
  const sw = fs.readFileSync(path.join(PROJECT_ROOT, "frontend/public/firebase-messaging-sw.js"), "utf8");
  sw.includes("delivery_otp") && sw.includes("loading_otp") ? ok("Service worker: delivery_otp + loading_otp urgent types") : fail("SW missing urgent types");

  // ══════════════════════════════════════
  section("12. RETURN FLOW");
  // ══════════════════════════════════════
  const returnCtrl = fs.readFileSync(path.join(PROJECT_ROOT, "backend/src/controllers/returnWorkflowController.ts"), "utf8");
  returnCtrl.includes("riderVerifyWarehouseOtp") ? ok("Return OTP verify endpoint exists") : fail("Missing");
  returnCtrl.includes("status !== 'Approved'") ? ok("riderVerifyWarehouseOtp accepts Approved status") : fail("Only accepts IN_TRANSIT");

  // Return controller notifies all warehouses
  returnCtrl.includes('Warehouse.find({ status: "ACTIVE" })') ? ok("Return notifications go to ALL warehouses") : fail("Only notifies one warehouse");

  // Warehouse return inbox shows all returns
  const returnGetCtrl = fs.readFileSync(path.join(PROJECT_ROOT, "backend/src/modules/warehouse/controllers/returnController.ts"), "utf8");
  !returnGetCtrl.includes("$in: WarehouseOrderItemIds") ? ok("Return inbox: shows ALL returns (no warehouse filter)") : fail("Still filtered by warehouse");

  // ══════════════════════════════════════
  section("13. PAYMENT FLOW");
  // ══════════════════════════════════════
  const stopDetail = fs.readFileSync(path.join(PROJECT_ROOT, "frontend/src/modules/delivery/pages/DriverStopDetail.tsx"), "utf8");
  stopDetail.includes("handlePaymentQuick") ? ok("Quick cash collection button exists") : fail("Missing");
  stopDetail.includes("isPrepaid") ? ok("Online/COD detection logic exists") : fail("Missing");
  stopDetail.includes("Collect ₹") ? ok("Collect cash CTA present") : fail("Missing");

  // ══════════════════════════════════════
  section("14. MAP (LEAFLET)");
  // ══════════════════════════════════════
  const stopsPage = fs.readFileSync(path.join(PROJECT_ROOT, "frontend/src/modules/delivery/pages/DriverRouteStops.tsx"), "utf8");
  stopsPage.includes("MapContainer") ? ok("Leaflet MapContainer in DriverRouteStops") : fail("Missing");
  stopsPage.includes("FitBounds") ? ok("Auto-fit bounds component") : fail("Missing");
  stopsPage.includes("zoomControl={true}") ? ok("Zoom controls enabled") : fail("Disabled");

  // ══════════════════════════════════════
  section("15. DELETED UNUSED FILES");
  // ══════════════════════════════════════
  const deleted = [
    "frontend/src/modules/warehouse/data/mockData.ts",
    "frontend/src/modules/warehouse/data/categoryMockData.ts",
    "frontend/src/modules/warehouse/data/productMockData.ts",
    "frontend/src/modules/warehouse/data/orderMockData.ts",
  ];
  for (const f of deleted) {
    !fs.existsSync(path.join(PROJECT_ROOT, f)) ? ok(`Deleted: ${f.split("/").pop()}`) : fail(`${f.split("/").pop()} still exists`);
  }

  // ══════════════════════════════════════
  section("16. DATABASE STATE");
  // ══════════════════════════════════════
  const dbStats: Record<string, number> = {
    Orders: await Order.countDocuments(),
    Products: await Product.countDocuments(),
    "Active Drivers": await Delivery.countDocuments({ status: "Active" }),
    "Active Warehouses": await Warehouse.countDocuments({ status: "ACTIVE" }),
    Routes: await DeliveryRoute.countDocuments(),
    "Route Stops": await RouteStop.countDocuments(),
    Returns: await Return.countDocuments(),
    Notifications: await Notification.countDocuments(),
  };
  for (const [label, count] of Object.entries(dbStats)) {
    info(`${label}: ${count}`);
  }

  // Order status distribution
  const statusAgg = await Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  for (const s of statusAgg) info(`  ${s._id}: ${s.count}`);

  // Payment method distribution
  const payAgg = await Order.aggregate([{ $group: { _id: "$paymentMethod", count: { $sum: 1 } } }]);
  for (const p of payAgg) info(`  Payment ${p._id || "null"}: ${p.count}`);

  // Product stock health
  const totalProducts = await Product.countDocuments();
  const outOfStock = await Product.countDocuments({ stock: 0 });
  const lowStock = await Product.countDocuments({ stock: { $gt: 0, $lte: 10 } });
  info(`Stock: ${totalProducts} products, ${outOfStock} out-of-stock, ${lowStock} low-stock`);

  // ══════════════════════════════════════
  section("17. PRODUCTION READINESS");
  // ══════════════════════════════════════
  // Check .env.production VAPID key
  const envProd = fs.readFileSync(path.join(PROJECT_ROOT, "frontend/.env.production"), "utf8");
  envProd.includes("REPLACE_WITH") ? warn("VAPID key NOT set in .env.production — FCM push won't work in prod") : ok("VAPID key configured");

  // Check .env has VAPID
  const envDev = fs.readFileSync(path.join(PROJECT_ROOT, "frontend/.env"), "utf8");
  envDev.includes("VITE_FIREBASE_VAPID_KEY=\n") || envDev.includes("VITE_FIREBASE_VAPID_KEY=$")
    ? warn("VAPID key empty in .env — FCM push won't work locally") : ok("VAPID key in .env");

  // Check tsconfig
  const tsconfig = fs.readFileSync(path.join(PROJECT_ROOT, "backend/tsconfig.json"), "utf8");
  tsconfig.includes('"5.0"') ? ok('tsconfig ignoreDeprecations: "5.0"') : warn("Check tsconfig ignoreDeprecations");

  // ══════════════════════════════════════
  // FINAL RESULTS
  // ══════════════════════════════════════
  console.log("\n" + "═".repeat(55));
  console.log(`\x1b[1m  PASSED: ${passed}  |  FAILED: ${failed}  |  WARNINGS: ${warnings}\x1b[0m`);
  console.log("═".repeat(55));
  if (failed === 0) {
    console.log("\x1b[32m\x1b[1m  ✅ ALL CHECKS PASSED\x1b[0m");
  } else {
    console.log(`\x1b[31m\x1b[1m  ❌ ${failed} CHECK(S) FAILED\x1b[0m`);
  }
  if (warnings > 0) {
    console.log(`\x1b[33m  ⚠ ${warnings} WARNING(S) — non-blocking\x1b[0m`);
  }
  console.log("");

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error("Script error:", e); process.exit(1); });
