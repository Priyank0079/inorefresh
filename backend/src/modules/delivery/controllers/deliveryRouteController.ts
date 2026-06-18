import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import DeliveryRoute from "../../../models/DeliveryRoute";
import RouteStop from "../../../models/RouteStop";
import ReturnableAsset from "../../../models/ReturnableAsset";
import Delivery from "../../../models/Delivery";
import Order from "../../../models/Order";
import { generateDeliveryOtp } from "../../../services/deliveryOtpService";
import { computeOrderWeights } from "../../../utils/orderWeight";

/**
 * Driver-side route execution (Phase 3): accept → load → start → per-stop
 * arrived → deliver → confirm. Additive to the existing on-demand flow.
 *
 * Authorization: the authenticated driver (req.user.userId) must own the route.
 */

const driverId = (req: Request) => req.user?.userId;

/** Load a route and assert the current driver owns it. */
async function getOwnedRoute(req: Request, res: Response) {
  const route = await DeliveryRoute.findById(req.params.id);
  if (!route) {
    res.status(404).json({ success: false, message: "Route not found" });
    return null;
  }
  if (!route.driver || String(route.driver) !== String(driverId(req))) {
    res.status(403).json({ success: false, message: "This route is not assigned to you" });
    return null;
  }
  return route;
}

/** Load a stop, its route, and assert the current driver owns the route. */
async function getOwnedStop(req: Request, res: Response) {
  const stop = await RouteStop.findById(req.params.stopId);
  if (!stop) {
    res.status(404).json({ success: false, message: "Stop not found" });
    return null;
  }
  const route = await DeliveryRoute.findById(stop.route);
  if (!route || !route.driver || String(route.driver) !== String(driverId(req))) {
    res.status(403).json({ success: false, message: "This stop is not on your route" });
    return null;
  }
  return { stop, route };
}

/**
 * GET /delivery/routes/today — the driver's active route + stops.
 */
export const getTodayRoute = asyncHandler(async (req: Request, res: Response) => {
  const route = await DeliveryRoute.findOne({
    driver: driverId(req),
    status: { $in: ["Assigned", "Accepted", "Loaded", "Out For Delivery"] },
  })
    .sort({ date: -1, createdAt: -1 })
    .populate({ path: "stops", options: { sort: { sequence: 1 } } })
    .lean();

  if (!route) {
    res.json({ success: true, data: null, message: "No active route assigned" });
    return;
  }

  // Always compute weight from order items (product.weight or ~1kg/unit fallback).
  if (Array.isArray(route.stops) && route.stops.length) {
    const wmap = await computeOrderWeights(route.stops.map((s: any) => s.order));
    let total = 0;
    for (const s of route.stops as any[]) {
      s.orderWeight = wmap.get(String(s.order)) || s.orderWeight || 0;
      total += s.orderWeight;
    }
    route.totals = { ...(route.totals || {}), totalWeight: total } as any;
  }

  // Attach order payment info to each stop so driver knows COD vs prepaid.
  if (Array.isArray(route.stops) && route.stops.length) {
    const orderIds = (route.stops as any[]).map((s) => s.order);
    const orders = await Order.find({ _id: { $in: orderIds } })
      .select("paymentMethod paymentStatus")
      .lean();
    const orderMap = new Map(orders.map((o: any) => [String(o._id), o]));
    for (const s of route.stops as any[]) {
      const o = orderMap.get(String(s.order));
      if (o) {
        s.orderPayment = { method: (o as any).paymentMethod, status: (o as any).paymentStatus };
      }
    }
  }

  res.json({ success: true, data: route });
});

/**
 * POST /delivery/routes/:id/accept
 */
export const acceptRoute = asyncHandler(async (req: Request, res: Response) => {
  const route = await getOwnedRoute(req, res);
  if (!route) return;
  if (route.status !== "Assigned") {
    res.status(409).json({ success: false, message: `Route cannot be accepted (status: ${route.status})` });
    return;
  }
  route.status = "Accepted";
  route.timeline.acceptedAt = new Date();
  await route.save();
  await Delivery.findByIdAndUpdate(driverId(req), { currentRoute: route._id });
  res.json({ success: true, message: "Route accepted", data: { id: route._id, status: route.status } });
});

/**
 * POST /delivery/routes/:id/loading-otp
 * Generates a 4-digit OTP, stores it on the route, and sends it to the
 * warehouse head who created this route (in-app notification).
 */
export const sendLoadingOtp = asyncHandler(async (req: Request, res: Response) => {
  const route = await getOwnedRoute(req, res);
  if (!route) return;
  if (!["Accepted", "Assigned"].includes(route.status)) {
    res.status(409).json({ success: false, message: `Cannot request loading OTP (status: ${route.status})` });
    return;
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  route.loadingOtp = otp;
  await route.save();

  const { sendNotification } = require("../../../services/notificationService");

  // Notify the warehouse head who created this route (bell + socket + FCM)
  if (route.createdBy) {
    await sendNotification(
      route.createdByModel || "Warehouse",
      String(route.createdBy),
      `🔐 Loading OTP: ${otp}`,
      `OTP for Route ${route.routeNumber}: ${otp}. Share this with the driver to confirm vehicle loading.`,
      { type: "Order", priority: "Urgent" },
    );
  }

  // Also notify the driver (bell confirmation)
  await sendNotification(
    "Delivery",
    String(driverId(req)),
    "OTP Requested",
    `Loading OTP sent to warehouse for Route ${route.routeNumber}. Ask the warehouse head for the code.`,
    { type: "Order", priority: "High", link: "/delivery/route/today" },
  );

  res.json({ success: true, message: "Loading OTP sent to warehouse" });
});

/**
 * POST /delivery/routes/:id/verify-load
 * Body: { otp, assets?: [{ type, qty }] }  — verifies OTP then records crates issued.
 */
export const verifyLoad = asyncHandler(async (req: Request, res: Response) => {
  const route = await getOwnedRoute(req, res);
  if (!route) return;
  if (!["Accepted", "Assigned"].includes(route.status)) {
    res.status(409).json({ success: false, message: `Cannot verify load (status: ${route.status})` });
    return;
  }

  const { otp, assets } = req.body as { otp?: string; assets?: Array<{ type: string; qty: number }> };

  if (!route.loadingOtp) {
    res.status(400).json({ success: false, message: "Please request a loading OTP first" });
    return;
  }
  const isDev = process.env.NODE_ENV !== "production" || process.env.USE_MOCK_OTP === "true";
  if (String(otp).trim() !== String(route.loadingOtp).trim() && !(isDev && otp === "9999")) {
    res.status(400).json({ success: false, message: "Invalid OTP. Please check with the warehouse head." });
    return;
  }

  if (Array.isArray(assets)) {
    for (const a of assets) {
      if (!a?.type || !a?.qty) continue;
      await ReturnableAsset.findOneAndUpdate(
        { route: route._id, type: a.type, stop: { $exists: false } },
        { $set: { issued: a.qty }, $setOnInsert: { collected: 0, missing: 0 } },
        { upsert: true, new: true },
      );
    }
  }

  route.loadingOtp = undefined;
  route.status = "Loaded";
  route.timeline.loadedAt = new Date();
  await route.save();

  // Notify warehouse that loading is confirmed
  const { sendNotification: notifyLoad } = require("../../../services/notificationService");
  if (route.createdBy) {
    await notifyLoad(
      route.createdByModel || "Warehouse",
      String(route.createdBy),
      "Vehicle Loaded ✓",
      `Route ${route.routeNumber} — vehicle loading verified by driver. Ready for dispatch.`,
      { type: "Success", priority: "High" },
    );
  }

  res.json({ success: true, message: "Vehicle loaded — OTP verified", data: { id: route._id, status: route.status } });
});

/**
 * POST /delivery/routes/:id/start
 */
export const startRoute = asyncHandler(async (req: Request, res: Response) => {
  const route = await getOwnedRoute(req, res);
  if (!route) return;
  if (route.status !== "Loaded") {
    res.status(409).json({ success: false, message: `Route must be Loaded to start (status: ${route.status})` });
    return;
  }
  route.status = "Out For Delivery";
  route.timeline.dispatchedAt = new Date();
  await route.save();

  // Move each stop's order into "Out for Delivery" for a sensible order lifecycle.
  const stops = await RouteStop.find({ route: route._id }).select("order").lean();
  await Order.updateMany(
    { _id: { $in: stops.map((s) => s.order) }, status: { $nin: ["Delivered", "Cancelled", "Rejected"] } },
    { $set: { status: "Out for Delivery", deliveryBoy: route.driver } },
  );

  res.json({ success: true, message: "Route started", data: { id: route._id, status: route.status } });
});

/**
 * POST /delivery/stops/:stopId/arrived
 * Body: { latitude?, longitude? }
 */
export const arriveAtStop = asyncHandler(async (req: Request, res: Response) => {
  const owned = await getOwnedStop(req, res);
  if (!owned) return;
  const { stop } = owned;
  if (stop.status !== "Pending") {
    res.status(409).json({ success: false, message: `Stop already ${stop.status}` });
    return;
  }
  const { latitude, longitude } = req.body;
  stop.status = "Arrived";
  stop.arrivedAt = new Date();
  stop.gpsAtArrival = { latitude, longitude };
  await stop.save();
  res.json({ success: true, message: "Marked arrived", data: { id: stop._id, status: stop.status } });
});

/**
 * PUT /delivery/stops/:stopId/deliver
 * Quantity-verification checkpoint — returns the order items for the driver to verify.
 */
export const deliverStop = asyncHandler(async (req: Request, res: Response) => {
  const owned = await getOwnedStop(req, res);
  if (!owned) return;
  const { stop } = owned;
  if (stop.status !== "Arrived") {
    res.status(409).json({ success: false, message: `Mark arrived first (status: ${stop.status})` });
    return;
  }
  const order = await Order.findById(stop.order).populate("items").lean();
  res.json({
    success: true,
    message: "Verify quantity, then confirm delivery",
    data: { stopId: stop._id, orderNumber: (order as any)?.orderNumber, items: (order as any)?.items || [] },
  });
});

/**
 * POST /delivery/stops/:stopId/send-otp — generate + send a delivery OTP to the customer.
 */
export const sendStopOtp = asyncHandler(async (req: Request, res: Response) => {
  const owned = await getOwnedStop(req, res);
  if (!owned) return;
  const { stop } = owned;
  const result = await generateDeliveryOtp(String(stop.order));

  // Notify the driver (bell) that OTP was sent to customer
  const { sendNotification } = require("../../../services/notificationService");
  await sendNotification(
    "Delivery",
    String(driverId(req)),
    "Delivery OTP Sent",
    `OTP sent to customer at Stop ${stop.sequence} (${stop.retailer?.name || ""}). Ask customer for the 4-digit code.`,
    { type: "Order", priority: "High", link: `/delivery/stop/${stop._id}` },
  );

  res.json({ success: true, message: result.message });
});

/**
 * POST /delivery/stops/:stopId/confirm
 * Body: { method: "OTP"|"Signature"|"Photo", otp?, proofUrl? }
 */
export const confirmStop = asyncHandler(async (req: Request, res: Response) => {
  const owned = await getOwnedStop(req, res);
  if (!owned) return;
  const { stop } = owned;
  const { method, otp, proofUrl } = req.body;

  if (!["OTP", "Signature", "Photo"].includes(method)) {
    res.status(400).json({ success: false, message: "method must be OTP, Signature or Photo" });
    return;
  }
  if (stop.status === "Delivered") {
    res.status(409).json({ success: false, message: "Stop already delivered" });
    return;
  }
  if (stop.status !== "Arrived") {
    res.status(409).json({ success: false, message: `Mark arrived first (status: ${stop.status})` });
    return;
  }

  const order = await Order.findById(stop.order);
  if (!order) {
    res.status(404).json({ success: false, message: "Order not found" });
    return;
  }

  let otpVerified = false;
  if (method === "OTP") {
    if (!otp) {
      res.status(400).json({ success: false, message: "OTP is required" });
      return;
    }
    const devBypass =
      (process.env.NODE_ENV !== "production" || process.env.USE_MOCK_OTP === "true") && otp === "9999";
    const valid = order.deliveryOtp && String(order.deliveryOtp).trim() === String(otp).trim();
    if (!devBypass && !valid) {
      res.status(400).json({ success: false, message: "Invalid OTP" });
      return;
    }
    otpVerified = true;
  } else {
    if (!proofUrl) {
      res.status(400).json({ success: false, message: `${method} proof (proofUrl) is required` });
      return;
    }
  }

  // Finalize the stop
  stop.status = "Delivered";
  stop.deliveredAt = new Date();
  stop.confirmation = { method, proofUrl, otpVerified };
  await stop.save();

  // Fetch inspection duration from settings
  let inspectionDuration = 10;
  try {
    const AppSettings = require("../../../models/AppSettings").default;
    const settings = await AppSettings.getSettings();
    inspectionDuration = settings?.inspectionDurationMinutes || 10;
  } catch (_e) {}

  // Reflect on the order — match what verifyDeliveryOtp sets
  order.status = "Delivered";
  order.deliveredAt = new Date();
  order.confirmationMethod = method;
  order.invoiceEnabled = true;
  order.inspectionStartedAt = new Date();
  order.inspectionExpiresAt = new Date(Date.now() + inspectionDuration * 60000);
  order.inspectionDurationMinutes = inspectionDuration;
  order.riderStatusDuringInspection = "WAITING_FOR_CUSTOMER_VERIFICATION";
  order.isVerifiedByCustomer = false;
  if (proofUrl) order.confirmationProofUrl = proofUrl;
  if (otpVerified) order.deliveryOtpVerified = true;
  await order.save();

  // Notify warehouse that this stop was delivered
  const { sendNotification: notifyDelivered } = require("../../../services/notificationService");
  const route = owned.route;
  if (route.createdBy) {
    const delivered = await RouteStop.countDocuments({ route: route._id, status: "Delivered" });
    const total = route.stops?.length || 0;
    await notifyDelivered(
      route.createdByModel || "Warehouse",
      String(route.createdBy),
      `Delivery Confirmed (${delivered}/${total})`,
      `Stop ${stop.sequence} — ${stop.retailer?.name || "Customer"} delivered (Order #${order.orderNumber}). ₹${order.total || 0}`,
      { type: "Success", priority: "Medium" },
    );
  }

  // Notify customer that their order is delivered
  await notifyDelivered(
    "Customer",
    String(order.customer),
    "Order Delivered",
    `Your order #${order.orderNumber} has been delivered successfully. Thank you!`,
    { type: "Success", priority: "High", link: `/orders/${order._id}` },
  );

  res.json({ success: true, message: "Delivery confirmed", data: { id: stop._id, status: stop.status } });
});

/**
 * POST /delivery/stops/:stopId/payment
 * Body: { method: "Cash"|"UPI"|"Bank Transfer", amount, referenceNo?, proofUrl? }
 * Cash increments the driver's held cash balance.
 */
export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const owned = await getOwnedStop(req, res);
  if (!owned) return;
  const { stop } = owned;
  const { method, amount, referenceNo, proofUrl } = req.body;

  if (!["Cash", "UPI", "Bank Transfer"].includes(method)) {
    res.status(400).json({ success: false, message: "method must be Cash, UPI or Bank Transfer" });
    return;
  }
  const amt = Number(amount);
  if (!amt || amt <= 0) {
    res.status(400).json({ success: false, message: "A positive amount is required" });
    return;
  }
  if (method !== "Cash" && !referenceNo) {
    res.status(400).json({ success: false, message: "referenceNo is required for UPI / Bank Transfer" });
    return;
  }
  if (stop.status === "Pending") {
    res.status(409).json({ success: false, message: "Mark arrived/delivered before collecting payment" });
    return;
  }

  stop.payment = { method, amountReceived: amt, referenceNo, proofUrl, status: "Collected" };
  await stop.save();

  // Cash physically held by the driver until reconciliation.
  if (method === "Cash") {
    await Delivery.findByIdAndUpdate(driverId(req), { $inc: { cashCollected: amt } });
  }

  res.json({ success: true, message: "Payment recorded", data: { id: stop._id, payment: stop.payment } });
});

/**
 * POST /delivery/stops/:stopId/return
 * Body: { reason, qtyKg?, photoUrl (required), action }
 */
export const recordReturn = asyncHandler(async (req: Request, res: Response) => {
  const owned = await getOwnedStop(req, res);
  if (!owned) return;
  const { stop } = owned;
  const { reason, qtyKg, photoUrl, action } = req.body;

  if (!reason) {
    res.status(400).json({ success: false, message: "Return reason is required" });
    return;
  }
  if (!photoUrl) {
    res.status(400).json({ success: false, message: "Photo evidence (photoUrl) is required for every return" });
    return;
  }
  if (action && !["Replacement", "Credit Note", "Return to Warehouse"].includes(action)) {
    res.status(400).json({ success: false, message: "Invalid return action" });
    return;
  }
  if (stop.status === "Pending") {
    res.status(409).json({ success: false, message: "Mark arrived before recording a return" });
    return;
  }

  stop.returns = stop.returns || [];
  stop.returns.push({ reason, qtyKg: Number(qtyKg) || 0, photoUrl, action });
  await stop.save();

  res.json({ success: true, message: "Return recorded", data: { id: stop._id, returns: stop.returns.length } });
});

/**
 * POST /delivery/stops/:stopId/assets
 * Body: { type, qtyCollected } — crates/ice boxes collected back at this stop.
 */
export const recordAssets = asyncHandler(async (req: Request, res: Response) => {
  const owned = await getOwnedStop(req, res);
  if (!owned) return;
  const { stop, route } = owned;
  const { type, qtyCollected } = req.body;

  const VALID = ["Fish Crate", "Ice Box", "Thermocol Box", "Plastic Tub"];
  if (!VALID.includes(type)) {
    res.status(400).json({ success: false, message: `type must be one of: ${VALID.join(", ")}` });
    return;
  }
  const qty = Number(qtyCollected);
  if (qty < 0 || Number.isNaN(qty)) {
    res.status(400).json({ success: false, message: "qtyCollected must be 0 or more" });
    return;
  }

  stop.assets = stop.assets || [];
  stop.assets.push({ type, qtyCollected: qty });
  await stop.save();

  // Roll up onto the route-level ledger.
  await ReturnableAsset.findOneAndUpdate(
    { route: route._id, type, stop: { $exists: false } },
    { $inc: { collected: qty }, $setOnInsert: { issued: 0, missing: 0 } },
    { upsert: true },
  );

  res.json({ success: true, message: "Assets recorded", data: { id: stop._id, type, qtyCollected: qty } });
});

/**
 * POST /delivery/routes/:id/complete
 * Body: { distanceKm? }
 */
export const completeRoute = asyncHandler(async (req: Request, res: Response) => {
  const route = await getOwnedRoute(req, res);
  if (!route) return;
  if (route.status !== "Out For Delivery") {
    res.status(409).json({ success: false, message: `Route must be Out For Delivery to complete (status: ${route.status})` });
    return;
  }

  const unresolved = await RouteStop.countDocuments({
    route: route._id,
    status: { $in: ["Pending", "Arrived"] },
  });
  if (unresolved > 0) {
    res.status(409).json({ success: false, message: `${unresolved} stop(s) still pending — resolve all stops first` });
    return;
  }

  const delivered = await RouteStop.countDocuments({ route: route._id, status: "Delivered" });

  route.status = "Completed";
  route.timeline.completedAt = new Date();
  if (req.body?.distanceKm != null) route.distanceKm = Number(req.body.distanceKm);
  await route.save();

  res.json({
    success: true,
    message: "Route completed",
    data: { id: route._id, status: route.status, deliveredStops: delivered, totalStops: route.totals.orderCount },
  });
});
