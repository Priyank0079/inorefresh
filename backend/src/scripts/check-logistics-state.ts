/**
 * Diagnostic — current state of the route-based logistics flow.
 * Run:  npm run check:logistics
 */
import mongoose from "mongoose";
import connectDB from "../config/db";
import Order from "../models/Order";
import DeliveryRoute from "../models/DeliveryRoute";
import RouteStop from "../models/RouteStop";
import Delivery from "../models/Delivery";

async function main() {
  await connectDB();

  console.log("\n================ LOGISTICS FLOW STATE ================\n");

  // Orders by status
  const byStatus = await Order.aggregate([
    { $group: { _id: "$status", n: { $sum: 1 } } },
    { $sort: { n: -1 } },
  ]);
  console.log("Orders by status:");
  byStatus.forEach((s) => console.log(`   ${s._id}: ${s.n}`));
  const confirmed = byStatus.find((s) => s._id === "Confirmed")?.n || 0;
  console.log(`\n→ "Confirmed" orders available to plan: ${confirmed}`);

  // Routes
  const routeCount = await DeliveryRoute.countDocuments();
  const withDriver = await DeliveryRoute.countDocuments({ driver: { $exists: true, $ne: null } });
  const stopCount = await RouteStop.countDocuments();
  console.log(`\nDeliveryRoutes: ${routeCount} (with a driver assigned: ${withDriver})`);
  console.log(`RouteStops: ${stopCount}`);

  if (routeCount > 0) {
    const routes = await DeliveryRoute.find().select("routeNumber status driver vehicle totals").limit(10).lean();
    console.log("\nRoutes:");
    routes.forEach((r: any) =>
      console.log(`   ${r.routeNumber} | ${r.status} | driver=${r.driver || "—"} | stops=${r.totals?.orderCount}`),
    );
  }

  // Drivers
  const drivers = await Delivery.find().select("name mobile currentRoute").limit(10).lean();
  console.log(`\nDrivers (${drivers.length} shown):`);
  drivers.forEach((d: any) =>
    console.log(`   ${d.name} (${d.mobile}) currentRoute=${d.currentRoute || "—"}`),
  );

  console.log("\n================ DIAGNOSIS ================");
  if (confirmed === 0) console.log('❌ No "Confirmed" orders → Route Planning screen will be EMPTY.');
  if (routeCount === 0) console.log("❌ No routes created yet.");
  if (routeCount > 0 && withDriver === 0)
    console.log("❌ Routes exist but NONE have a driver → driver Route tab shows 'No route assigned'.");
  if (confirmed > 0 && withDriver > 0) console.log("✅ Data present — driver should see a route.");
  console.log("==========================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
