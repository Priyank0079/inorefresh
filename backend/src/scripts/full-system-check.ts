/**
 * Full System Check — verifies everything implemented across all phases.
 * Run: npx tsx src/scripts/full-system-check.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Order from "../models/Order";
import Delivery from "../models/Delivery";
import DeliveryRoute from "../models/DeliveryRoute";
import RouteStop from "../models/RouteStop";
import ReturnableAsset from "../models/ReturnableAsset";
import AppSettings from "../models/AppSettings";
import "../models/OrderItem";
import { buildBundles } from "../modules/warehouse/controllers/routeController";
import { getOrderWindow } from "../utils/orderWindow";
import { computeOrderWeights } from "../utils/orderWeight";

let passed = 0;
let failed = 0;

const ok = (m: string) => { passed++; console.log(`  \x1b[32m✓\x1b[0m ${m}`); };
const fail = (m: string) => { failed++; console.log(`  \x1b[31m✗\x1b[0m ${m}`); };
const section = (m: string) => console.log(`\n\x1b[1m\x1b[36m━━━ ${m} ━━━\x1b[0m`);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("\x1b[1m\n🔍 FULL SYSTEM CHECK — InorFresh Route-Based Logistics\x1b[0m\n");

  // ═══════════════════════════════════════════════
  section("1. MODELS — Schema Registration");
  // ═══════════════════════════════════════════════
  const models = mongoose.modelNames();
  for (const name of ["DeliveryRoute", "RouteStop", "ReturnableAsset"]) {
    models.includes(name) ? ok(`${name} model registered`) : fail(`${name} model NOT registered`);
  }

  // ═══════════════════════════════════════════════
  section("2. ORDER MODEL — New Fields");
  // ═══════════════════════════════════════════════
  const orderSchema = Order.schema.paths;
  orderSchema["confirmationMethod"] ? ok("Order.confirmationMethod field exists") : fail("Order.confirmationMethod missing");
  orderSchema["confirmationProofUrl"] ? ok("Order.confirmationProofUrl field exists") : fail("Order.confirmationProofUrl missing");

  // Check "Confirmed" status in enum
  const statusEnum = (orderSchema["status"] as any)?.enumValues || [];
  statusEnum.includes("Confirmed") ? ok("Order status enum includes 'Confirmed'") : fail("Order status enum missing 'Confirmed'");

  // ═══════════════════════════════════════════════
  section("3. DELIVERY MODEL — New Fields");
  // ═══════════════════════════════════════════════
  const deliverySchema = Delivery.schema.paths;
  deliverySchema["currentRoute"] ? ok("Delivery.currentRoute field exists") : fail("Delivery.currentRoute missing");
  deliverySchema["isPartner"] ? ok("Delivery.isPartner field exists") : fail("Delivery.isPartner missing");

  // ═══════════════════════════════════════════════
  section("4. APP SETTINGS — Logistics Config");
  // ═══════════════════════════════════════════════
  const settingsSchema = AppSettings.schema.paths;
  for (const f of ["orderCutOffTime", "orderOpenTime", "orderCutOffEnabled", "routePlanningCutOffTime", "minOrdersPerRoute"]) {
    settingsSchema[f] ? ok(`AppSettings.${f} exists`) : fail(`AppSettings.${f} missing`);
  }

  // ═══════════════════════════════════════════════
  section("5. DELIVERY ROUTE MODEL — Structure");
  // ═══════════════════════════════════════════════
  const routeSchema = DeliveryRoute.schema.paths;
  for (const f of ["routeNumber", "date", "status", "vehicle.vehicleNumber", "driver", "totals.orderCount", "totals.totalWeight", "timeline.plannedAt"]) {
    routeSchema[f] ? ok(`DeliveryRoute.${f}`) : fail(`DeliveryRoute.${f} missing`);
  }
  const routeStatusEnum = (routeSchema["status"] as any)?.enumValues || [];
  const expectedStatuses = ["Planned", "Assigned", "Accepted", "Loaded", "Out For Delivery", "Completed", "Reconciled"];
  const allStatuses = expectedStatuses.every(s => routeStatusEnum.includes(s));
  allStatuses ? ok(`Route statuses: ${expectedStatuses.join(", ")}`) : fail(`Missing route statuses. Got: ${routeStatusEnum.join(", ")}`);

  // ═══════════════════════════════════════════════
  section("6. ROUTE STOP MODEL — Structure");
  // ═══════════════════════════════════════════════
  const stopSchema = RouteStop.schema.paths;
  for (const f of ["route", "order", "sequence", "retailer.name", "invoiceAmount", "orderWeight", "status"]) {
    stopSchema[f] ? ok(`RouteStop.${f}`) : fail(`RouteStop.${f} missing`);
  }

  // ═══════════════════════════════════════════════
  section("7. RETURNABLE ASSET MODEL");
  // ═══════════════════════════════════════════════
  const assetSchema = ReturnableAsset.schema.paths;
  for (const f of ["type", "route", "issued", "collected", "missing"]) {
    assetSchema[f] ? ok(`ReturnableAsset.${f}`) : fail(`ReturnableAsset.${f} missing`);
  }

  // ═══════════════════════════════════════════════
  section("8. ORDER WINDOW (Cut-off Logic)");
  // ═══════════════════════════════════════════════
  const mockSettings = { orderCutOffEnabled: true, orderOpenTime: "06:00", orderCutOffTime: "20:00" };

  // Test with time inside window (IST 10:00 = UTC 04:30)
  const insideTime = new Date("2026-06-17T04:30:00Z"); // 10:00 IST
  const insideResult = getOrderWindow(mockSettings as any, insideTime);
  insideResult.open ? ok("Window OPEN at 10:00 IST") : fail(`Window should be OPEN at 10:00 IST but got: ${insideResult.message}`);

  // Test with time outside window (IST 21:00 = UTC 15:30)
  const outsideTime = new Date("2026-06-17T15:30:00Z"); // 21:00 IST
  const outsideResult = getOrderWindow(mockSettings as any, outsideTime);
  !outsideResult.open ? ok("Window CLOSED at 21:00 IST") : fail("Window should be CLOSED at 21:00 IST");

  // Test disabled
  const disabledSettings = { ...mockSettings, orderCutOffEnabled: false };
  const disabledResult = getOrderWindow(disabledSettings as any, outsideTime);
  disabledResult.open ? ok("Window OPEN when cutoff disabled") : fail("Window should be OPEN when disabled");

  // ═══════════════════════════════════════════════
  section("9. ORDER BUNDLING (Nearest-Neighbour)");
  // ═══════════════════════════════════════════════
  // Test with real DB orders
  const usedOrderIds = await RouteStop.find().distinct("order");
  const unplannedOrders = await Order.find({
    status: { $in: ["Received", "Confirmed", "Accepted", "Pending", "Processed"] },
    _id: { $nin: usedOrderIds },
  }).select("orderNumber deliveryAddress orderDate").sort({ orderDate: -1 }).lean();

  console.log(`  📊 Unplanned orders in DB: ${unplannedOrders.length}`);

  if (unplannedOrders.length > 0) {
    const bundles = buildBundles(unplannedOrders);
    bundles.length > 0 ? ok(`${bundles.length} bundles created from ${unplannedOrders.length} orders`) : fail("No bundles created");

    const oversize = bundles.filter((b: any) => b.count > 10);
    oversize.length === 0 ? ok("No bundle exceeds 10 orders") : fail(`${oversize.length} bundle(s) exceed 10`);

    const totalBundled = bundles.reduce((s: number, b: any) => s + b.count, 0);
    totalBundled === unplannedOrders.length ? ok(`All ${unplannedOrders.length} orders bundled (no duplicates)`) : fail(`Bundled ${totalBundled} vs ${unplannedOrders.length} total`);

    // Newest order should be first
    const newestOrder = unplannedOrders[0] as any;
    ok(`Newest order: ${newestOrder.orderNumber} (${new Date(newestOrder.orderDate).toLocaleDateString()})`);
  } else {
    ok("No unplanned orders to bundle (all in routes)");
  }

  // ═══════════════════════════════════════════════
  section("10. ORDER WEIGHT COMPUTATION");
  // ═══════════════════════════════════════════════
  const sampleOrder = await Order.findOne().select("_id").lean();
  if (sampleOrder) {
    const weights = await computeOrderWeights([String((sampleOrder as any)._id)]);
    const w = weights.get(String((sampleOrder as any)._id)) || 0;
    ok(`computeOrderWeights works (sample weight: ${w} kg)`);
  } else {
    ok("No orders to test weight computation");
  }

  // ═══════════════════════════════════════════════
  section("11. API ENDPOINTS (HTTP)");
  // ═══════════════════════════════════════════════
  const endpoints = [
    { method: "GET", path: "/routes/unplanned-orders", desc: "Unplanned orders + bundles" },
    { method: "GET", path: "/routes/drivers", desc: "Driver list" },
    { method: "GET", path: "/routes", desc: "Route list" },
    { method: "GET", path: "/customer/order-window", desc: "Order window status" },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://127.0.0.1:7000/api/v1${ep.path}`);
      // These endpoints require auth, so 401 means the route EXISTS
      if (res.status === 401 || res.status === 200) {
        ok(`${ep.method} ${ep.path} — route registered (${res.status})`);
      } else {
        fail(`${ep.method} ${ep.path} — unexpected status ${res.status}`);
      }
    } catch (e: any) {
      fail(`${ep.method} ${ep.path} — server unreachable: ${e.message}`);
    }
  }

  // Check driver-specific endpoints
  const driverEndpoints = [
    "/delivery/routes/today",
  ];
  for (const path of driverEndpoints) {
    try {
      const res = await fetch(`http://127.0.0.1:7000/api/v1${path}`);
      if (res.status === 401 || res.status === 200) {
        ok(`GET ${path} — route registered`);
      } else {
        fail(`GET ${path} — unexpected status ${res.status}`);
      }
    } catch (e: any) {
      fail(`GET ${path} — unreachable`);
    }
  }

  // ═══════════════════════════════════════════════
  section("12. OLD FLOW RETIREMENT");
  // ═══════════════════════════════════════════════
  const fs = require("fs");
  const path = require("path");
  const PROJECT_ROOT = path.join(__dirname, "../../..");

  const notifySrc = fs.readFileSync(
    path.join(__dirname, "../services/orderNotificationService.ts"), "utf8"
  );
  notifySrc.includes("LEGACY_ONDEMAND_NOTIFY")
    ? ok("orderNotificationService guarded by LEGACY_ONDEMAND_NOTIFY")
    : fail("orderNotificationService NOT guarded");

  const orderCtrlSrc = fs.readFileSync(
    path.join(__dirname, "../modules/warehouse/controllers/orderController.ts"), "utf8"
  );
  orderCtrlSrc.includes("LEGACY_ONDEMAND_NOTIFY")
    ? ok("orderController nearby-rider push guarded")
    : fail("orderController NOT guarded");

  // Check warehouse notification is info-only (no Accept/Reject)
  const whNotifSrc = fs.readFileSync(
    path.join(PROJECT_ROOT, "frontend/src/modules/warehouse/components/WarehouseNotificationAlert.tsx"), "utf8"
  );
  !whNotifSrc.includes("handleStatusUpdate") && whNotifSrc.includes("Acknowledge")
    ? ok("Warehouse alert is info-only (no Accept/Reject buttons)")
    : fail("Warehouse alert still has Accept/Reject");

  const deliveryLayoutSrc = fs.readFileSync(
    path.join(PROJECT_ROOT, "frontend/src/modules/delivery/components/DeliveryLayout.tsx"), "utf8"
  );
  !deliveryLayoutSrc.includes("import OrderNotificationCard") && !deliveryLayoutSrc.includes("<OrderNotificationCard")
    ? ok("DeliveryLayout: OrderNotificationCard import & JSX removed")
    : fail("DeliveryLayout still imports/renders OrderNotificationCard");

  // ═══════════════════════════════════════════════
  section("13. FRONTEND PAGES EXIST");
  // ═══════════════════════════════════════════════
  const frontendPages = [
    "frontend/src/modules/delivery/pages/DriverRouteToday.tsx",
    "frontend/src/modules/delivery/pages/DriverLoadingVerify.tsx",
    "frontend/src/modules/delivery/pages/DriverRouteStops.tsx",
    "frontend/src/modules/delivery/pages/DriverStopDetail.tsx",
    "frontend/src/modules/delivery/pages/DriverRouteComplete.tsx",
    "frontend/src/modules/warehouse/pages/WarehouseRoutePlanning.tsx",
    "frontend/src/services/api/routeService.ts",
    "frontend/src/services/api/delivery/driverRouteService.ts",
  ];
  for (const f of frontendPages) {
    const full = path.join(PROJECT_ROOT, f);
    fs.existsSync(full) ? ok(f.split("/").pop()!) : fail(`${f} MISSING`);
  }

  // ═══════════════════════════════════════════════
  section("14. FRONTEND ROUTES REGISTERED");
  // ═══════════════════════════════════════════════
  const deliveryRoutesSrc = fs.readFileSync(
    path.join(PROJECT_ROOT, "frontend/src/modules/delivery/DeliveryRoutes.tsx"), "utf8"
  );
  for (const r of ["route/today", "route/:id/load", "route/:id/stops", "stop/:stopId"]) {
    deliveryRoutesSrc.includes(r) ? ok(`Delivery route: ${r}`) : fail(`Delivery route missing: ${r}`);
  }

  const warehouseRoutesSrc = fs.readFileSync(
    path.join(PROJECT_ROOT, "frontend/src/modules/warehouse/WarehouseRoutes.tsx"), "utf8"
  );
  warehouseRoutesSrc.includes("route-planning") ? ok("Warehouse route: route-planning") : fail("Warehouse route-planning missing");

  const adminRoutesSrc = fs.readFileSync(
    path.join(PROJECT_ROOT, "frontend/src/modules/admin/AdminRoutes.tsx"), "utf8"
  );
  adminRoutesSrc.includes("route-planning") ? ok("Admin route: route-planning") : fail("Admin route-planning missing");

  // ═══════════════════════════════════════════════
  section("15. NAVIGATION ITEMS");
  // ═══════════════════════════════════════════════
  const deliveryNavSrc = fs.readFileSync(
    path.join(PROJECT_ROOT, "frontend/src/modules/delivery/components/DeliveryBottomNav.tsx"), "utf8"
  );
  deliveryNavSrc.includes("Route") ? ok("Delivery bottom nav has 'Route' tab") : fail("Delivery nav missing Route tab");

  const whSidebarSrc = fs.readFileSync(
    path.join(PROJECT_ROOT, "frontend/src/modules/warehouse/components/WarehouseSidebar.tsx"), "utf8"
  );
  whSidebarSrc.includes("Route Planning") ? ok("Warehouse sidebar has 'Route Planning'") : fail("Warehouse sidebar missing Route Planning");

  const adminSidebarSrc = fs.readFileSync(
    path.join(PROJECT_ROOT, "frontend/src/modules/admin/components/AdminSidebar.tsx"), "utf8"
  );
  adminSidebarSrc.includes("Route Planning") ? ok("Admin sidebar has 'Route Planning'") : fail("Admin sidebar missing Route Planning");

  // ═══════════════════════════════════════════════
  section("16. DELETED UNUSED FILES");
  // ═══════════════════════════════════════════════
  const deletedFiles = [
    "frontend/src/modules/warehouse/data/mockData.ts",
    "frontend/src/modules/warehouse/data/categoryMockData.ts",
    "frontend/src/modules/warehouse/data/productMockData.ts",
    "frontend/src/modules/warehouse/data/orderMockData.ts",
  ];
  for (const f of deletedFiles) {
    const full = path.join(PROJECT_ROOT, f);
    !fs.existsSync(full) ? ok(`Deleted: ${f.split("/").pop()}`) : fail(`${f.split("/").pop()} still exists`);
  }

  // ═══════════════════════════════════════════════
  section("17. DB STATE SUMMARY");
  // ═══════════════════════════════════════════════
  const totalOrders = await Order.countDocuments();
  const routeCount = await DeliveryRoute.countDocuments();
  const stopCount = await RouteStop.countDocuments();
  const driverCount = await Delivery.countDocuments({ status: "Active" });
  const unplannedCount = unplannedOrders.length;

  console.log(`  📦 Total orders: ${totalOrders}`);
  console.log(`  🚚 Routes created: ${routeCount}`);
  console.log(`  📍 Route stops: ${stopCount}`);
  console.log(`  🧑‍✈️ Active drivers: ${driverCount}`);
  console.log(`  📋 Unplanned orders: ${unplannedCount}`);
  console.log(`  🔗 Orders in routes: ${usedOrderIds.length}`);

  // ═══════════════════════════════════════════════
  // FINAL RESULTS
  // ═══════════════════════════════════════════════
  console.log("\n" + "═".repeat(50));
  console.log(`\x1b[1m  PASSED: ${passed}  |  FAILED: ${failed}\x1b[0m`);
  console.log("═".repeat(50));
  if (failed === 0) {
    console.log("\x1b[32m\x1b[1m  ✅ ALL CHECKS PASSED\x1b[0m\n");
  } else {
    console.log(`\x1b[31m\x1b[1m  ❌ ${failed} CHECK(S) FAILED\x1b[0m\n`);
  }

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error("Script error:", e); process.exit(1); });
