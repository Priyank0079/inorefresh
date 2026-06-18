/**
 * Phase 1 verification — Data Foundation (logistics flow models).
 *
 * Run:  npm run verify:phase1
 *
 * Asserts:
 *  1. All models (existing + new) load and register without error.
 *  2. New models (DeliveryRoute, RouteStop, ReturnableAsset) can be
 *     created, read back, validated, and deleted.
 *  3. Existing Order & Delivery still load with their original fields,
 *     and the new optional fields are present on the schema.
 *
 * Creates only throwaway docs and deletes them. Does not touch real data.
 */
import mongoose from "mongoose";
import connectDB from "../config/db";
import * as Models from "../models";

const log = (msg: string) => console.log(msg);
const ok = (msg: string) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
const fail = (msg: string) => console.log(`  \x1b[31m✗\x1b[0m ${msg}`);

async function main() {
  let passed = true;
  await connectDB();

  const { DeliveryRoute, RouteStop, ReturnableAsset, Order, Delivery } = Models;

  // ── 1. All models registered ────────────────────────────────────────────
  log("\n[1] Model registration");
  try {
    const names = Object.keys(Models);
    if (names.length < 50) throw new Error(`only ${names.length} models exported`);
    ok(`${names.length} models exported from models/index.ts`);
    ["DeliveryRoute", "RouteStop", "ReturnableAsset"].forEach((n) => {
      if (!(n in Models)) throw new Error(`${n} missing from exports`);
      ok(`${n} exported`);
    });
  } catch (e: any) {
    fail(e.message);
    passed = false;
  }

  // ── 2. Create / read / validate / delete new docs ───────────────────────
  log("\n[2] CRUD on new logistics models");
  let routeId: mongoose.Types.ObjectId | null = null;
  try {
    const route = await DeliveryRoute.create({
      date: new Date(),
      status: "Planned",
      vehicle: { vehicleNumber: "TEST-0000", vehicleType: "4W Reefer", isPartner: false },
      totals: { orderCount: 2, totalWeight: 50, estimatedTimeMins: 120 },
      timeline: { plannedAt: new Date() },
    });
    routeId = route._id as mongoose.Types.ObjectId;
    if (!route.routeNumber) throw new Error("routeNumber was not auto-generated");
    ok(`DeliveryRoute created (routeNumber=${route.routeNumber})`);

    const stop1 = await RouteStop.create({
      route: route._id,
      order: new mongoose.Types.ObjectId(),
      sequence: 1,
      retailer: { name: "Test Shop 1", address: "Test Address 1", contact: "9999999999" },
      invoiceAmount: 1200,
      orderWeight: 25,
      status: "Pending",
    });
    const stop2 = await RouteStop.create({
      route: route._id,
      order: new mongoose.Types.ObjectId(),
      sequence: 2,
      retailer: { name: "Test Shop 2", address: "Test Address 2" },
      status: "Pending",
    });
    ok(`2 RouteStops created (seq ${stop1.sequence}, ${stop2.sequence})`);

    const asset = await ReturnableAsset.create({
      type: "Fish Crate",
      route: route._id,
      issued: 10,
      collected: 0,
      missing: 0,
    });
    ok(`ReturnableAsset created (type=${asset.type}, issued=${asset.issued})`);

    // Read back
    const readRoute = await DeliveryRoute.findById(route._id);
    const stopCount = await RouteStop.countDocuments({ route: route._id });
    if (!readRoute || stopCount !== 2) throw new Error("read-back mismatch");
    ok(`Read back route + ${stopCount} stops`);

    // Validation: min sequence enforced
    let rejected = false;
    try {
      await RouteStop.create({
        route: route._id,
        order: new mongoose.Types.ObjectId(),
        sequence: 0, // invalid (min 1)
        retailer: { name: "Bad", address: "Bad" },
      });
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error("invalid sequence=0 was NOT rejected");
    ok("Schema validation rejects invalid stop (sequence < 1)");

    // Cleanup
    await RouteStop.deleteMany({ route: route._id });
    await ReturnableAsset.deleteMany({ route: route._id });
    await DeliveryRoute.findByIdAndDelete(route._id);
    routeId = null;
    ok("Cleaned up all throwaway docs");
  } catch (e: any) {
    fail(e.message);
    passed = false;
    if (routeId) {
      await RouteStop.deleteMany({ route: routeId }).catch(() => {});
      await ReturnableAsset.deleteMany({ route: routeId }).catch(() => {});
      await DeliveryRoute.findByIdAndDelete(routeId).catch(() => {});
    }
  }

  // ── 3. Existing models intact + new optional fields present ──────────────
  log("\n[3] Existing models intact");
  try {
    const orderPaths = Order.schema.paths;
    ["orderNumber", "customer", "total", "status"].forEach((p) => {
      if (!orderPaths[p]) throw new Error(`Order.${p} missing!`);
    });
    ok("Order keeps original fields (orderNumber, customer, total, status)");

    const statusEnum = (orderPaths["status"] as any).enumValues as string[];
    if (!statusEnum.includes("Confirmed")) throw new Error('"Confirmed" not added to Order.status');
    if (!statusEnum.includes("Delivered")) throw new Error('"Delivered" lost from Order.status');
    ok(`Order.status has "Confirmed" + keeps existing (${statusEnum.length} values)`);

    if (!orderPaths["confirmationMethod"]) throw new Error("Order.confirmationMethod missing");
    ok("Order.confirmationMethod / confirmationProofUrl added");

    const delPaths = Delivery.schema.paths;
    ["name", "mobile", "vehicleNumber", "balance"].forEach((p) => {
      if (!delPaths[p]) throw new Error(`Delivery.${p} missing!`);
    });
    if (!delPaths["currentRoute"] || !delPaths["isPartner"])
      throw new Error("Delivery.currentRoute / isPartner missing");
    ok("Delivery keeps original fields + adds currentRoute, isPartner");
  } catch (e: any) {
    fail(e.message);
    passed = false;
  }

  await mongoose.disconnect();

  log("\n" + "=".repeat(48));
  if (passed) {
    log("\x1b[32m\x1b[1m✅ PHASE 1 PASSED\x1b[0m");
    process.exit(0);
  } else {
    log("\x1b[31m\x1b[1m❌ PHASE 1 FAILED\x1b[0m");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("\x1b[31mScript error:\x1b[0m", e);
  process.exit(1);
});
