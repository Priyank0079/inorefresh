/**
 * Verification — daily ordering cut-off (06:00–20:00 IST, toggleable).
 *
 * Run:  npm run verify:cutoff
 *
 * Pure-logic tests on getOrderWindow at boundary times (IST), plus a check
 * that the createOrder controller blocks when closed. No DB writes.
 */
import mongoose from "mongoose";
import connectDB from "../config/db";
import { getOrderWindow } from "../utils/orderWindow";
import * as orderCtrl from "../modules/customer/controllers/customerOrderController";

const ok = (m: string) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const fail = (m: string) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);

/** Build a Date whose IST wall-clock is hh:mm (IST = UTC+5:30). */
function istDate(hh: number, mm: number): Date {
  let total = hh * 60 + mm - 330; // back to UTC minutes
  let dayOffset = 0;
  if (total < 0) { total += 1440; dayOffset = -1; }
  const uh = Math.floor(total / 60);
  const um = total % 60;
  return new Date(Date.UTC(2026, 0, 2 + dayOffset, uh, um, 0));
}

function invoke(handler: any, reqLike: any): Promise<{ statusCode: number; payload: any }> {
  return new Promise((resolve, reject) => {
    const req: any = { body: {}, params: {}, query: {}, user: { userId: "x", userType: "Customer" }, ...reqLike };
    let statusCode = 200;
    const res: any = {
      status(c: number) { statusCode = c; return res; },
      json(payload: any) { resolve({ statusCode, payload }); return res; },
    };
    Promise.resolve(handler(req, res, () => {})).catch(reject);
  });
}

async function main() {
  let passed = true;
  const settings = { orderCutOffEnabled: true, orderOpenTime: "06:00", orderCutOffTime: "20:00" };

  console.log("\n[1] Window logic at IST boundary times (open 06:00–20:00)");
  const cases: Array<[number, number, boolean]> = [
    [5, 59, false], // before open
    [6, 0, true],   // open edge (inclusive)
    [12, 0, true],  // midday
    [19, 59, true], // just before close
    [20, 0, false], // close edge (exclusive)
    [22, 30, false],// after 8 PM
    [0, 30, false], // past midnight
  ];
  for (const [h, m, expected] of cases) {
    const r = getOrderWindow(settings, istDate(h, m));
    if (r.open !== expected) { fail(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} expected open=${expected}, got ${r.open}`); passed = false; }
    else ok(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} → open=${r.open}`);
  }

  console.log("\n[2] Toggle OFF → always open");
  const off = getOrderWindow({ orderCutOffEnabled: false }, istDate(23, 0));
  if (!off.open) { fail("disabled flag should keep ordering open"); passed = false; }
  else ok("orderCutOffEnabled=false → open 24/7");

  console.log("\n[3] Controller blocks placement after cut-off");
  // Force settings to closed regardless of real clock by stubbing getSettings.
  const AppSettings = (await import("../models/AppSettings")).default as any;
  const realGet = AppSettings.getSettings;
  AppSettings.getSettings = async () => ({ orderCutOffEnabled: true, orderOpenTime: "06:00", orderCutOffTime: "00:01" });
  // With closesAt 00:01, the window is effectively closed almost all day.
  await connectDB();
  const r = await invoke(orderCtrl.createOrder, { body: { items: [{ product: { id: "x" }, quantity: 1 }] } });
  AppSettings.getSettings = realGet;
  if (r.statusCode !== 403 || r.payload?.code !== "ORDERING_CLOSED") {
    fail(`expected 403 ORDERING_CLOSED, got ${r.statusCode} ${r.payload?.code || ""}`); passed = false;
  } else ok(`createOrder blocked (403 ORDERING_CLOSED): "${r.payload?.message}"`);

  await mongoose.disconnect();
  console.log("\n" + "=".repeat(48));
  console.log(passed ? "\x1b[32m\x1b[1m✅ ORDER CUT-OFF PASSED\x1b[0m" : "\x1b[31m\x1b[1m❌ ORDER CUT-OFF FAILED\x1b[0m");
  process.exit(passed ? 0 : 1);
}

main().catch((e) => { console.error("Script error:", e); process.exit(1); });
