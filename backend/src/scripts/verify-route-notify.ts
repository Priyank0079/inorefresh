/**
 * Verification — driver gets a notification when a route is assigned.
 *
 * Run:  npm run verify:notify
 *
 * Creates a driver + 10 orders, assigns a route to the driver via the real
 * createRoute controller, and asserts a Notification was persisted for that
 * driver. Cleans up all throwaway data.
 */
import mongoose from "mongoose";
import connectDB from "../config/db";
import Delivery from "../models/Delivery";
import Order from "../models/Order";
import DeliveryRoute from "../models/DeliveryRoute";
import RouteStop from "../models/RouteStop";
import Notification from "../models/Notification";
import * as routeController from "../modules/warehouse/controllers/routeController";

const TAG = "NOTIFY_TEST";
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
    Promise.resolve(handler(req, res, (e: any) => (e ? reject(e) : resolve({ statusCode, payload: null })))).catch(reject);
  });
}

async function cleanup(driverId?: string) {
  const orderIds = await Order.find({ customerName: TAG }).distinct("_id");
  const routeIds = await DeliveryRoute.find({ "vehicle.vehicleNumber": "NOTIFY-TEST" }).distinct("_id");
  await RouteStop.deleteMany({ $or: [{ order: { $in: orderIds } }, { route: { $in: routeIds } }] });
  await DeliveryRoute.deleteMany({ _id: { $in: routeIds } });
  await Order.deleteMany({ customerName: TAG });
  if (driverId) {
    await Notification.deleteMany({ recipientId: driverId });
    await Delivery.findByIdAndDelete(driverId);
  }
  await Delivery.deleteMany({ name: TAG });
}

async function main() {
  let passed = true;
  await connectDB();
  await cleanup();

  const rnd = Date.now().toString().slice(-7);
  let driverId = "";

  try {
    const driver = await Delivery.create({
      name: TAG, mobile: `9${rnd.padStart(9, "0")}`.slice(0, 10),
      email: `notify_${rnd}@test.com`, password: "test1234", status: "Active",
    });
    driverId = String(driver._id);

    const made: string[] = [];
    for (let i = 0; i < 10; i++) {
      const o = await Order.create({
        customer: new mongoose.Types.ObjectId(), customerName: TAG, customerPhone: "9000000000",
        deliveryAddress: { address: `Shop ${i + 1}`, city: "TestCity", pincode: "400001" },
        subtotal: 500, total: 500, paymentMethod: "COD", status: "Confirmed",
      });
      made.push(String(o._id));
    }
    ok("Seeded driver + 10 confirmed orders");

    const user = { userId: new mongoose.Types.ObjectId().toString(), userType: "Warehouse" };
    const r = await invoke(routeController.createRoute, {
      user,
      body: { vehicle: { vehicleNumber: "NOTIFY-TEST" }, driver: driverId, orderIds: made },
    });
    if (r.statusCode !== 201) throw new Error(`createRoute status ${r.statusCode}: ${r.payload?.message}`);
    ok(`Route created & assigned to driver (${r.payload?.data?.routeNumber})`);

    // Give the async notification a brief moment (sendNotification is awaited, but be safe)
    const note = await Notification.findOne({ recipientType: "Delivery", recipientId: driverId }).sort({ createdAt: -1 });
    if (!note) throw new Error("No notification created for the driver");
    if (!/route/i.test(note.title)) throw new Error(`Unexpected notification title: ${note.title}`);
    ok(`Driver notification persisted: "${note.title}" → link ${(note as any).link}`);
  } catch (e: any) {
    fail(e.message);
    passed = false;
  }

  await cleanup(driverId);
  ok("Cleaned up all throwaway data");

  await mongoose.disconnect();
  console.log("\n" + "=".repeat(48));
  console.log(passed ? "\x1b[32m\x1b[1m✅ ROUTE NOTIFY PASSED\x1b[0m" : "\x1b[31m\x1b[1m❌ ROUTE NOTIFY FAILED\x1b[0m");
  process.exit(passed ? 0 : 1);
}

main().catch((e) => { console.error("Script error:", e); process.exit(1); });
