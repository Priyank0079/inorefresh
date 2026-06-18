import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../../../utils/asyncHandler";
import DeliveryRoute from "../../../models/DeliveryRoute";
import RouteStop from "../../../models/RouteStop";
import Order from "../../../models/Order";
import AppSettings from "../../../models/AppSettings";
import Delivery from "../../../models/Delivery";
import { sendNotification } from "../../../services/notificationService";
import { computeOrderWeights } from "../../../utils/orderWeight";
import { calculateDistance } from "../../../utils/locationHelper";

const BUNDLE_SIZE = 10;

/**
 * Group unplanned orders into bundles of up to 10 — nearest-neighbour by GPS
 * when coordinates exist, otherwise grouped by city. Each bundle is a ready
 * candidate route the planner can select in one click.
 */
export function buildBundles(orders: any[]): any[] {
  const hasCoord = (o: any) =>
    o.deliveryAddress?.latitude != null && o.deliveryAddress?.longitude != null;

  const withCoords = orders.filter(hasCoord);
  const withoutCoords = orders.filter((o) => !hasCoord(o));
  const bundles: any[][] = [];

  // Greedy nearest-neighbour over geo-located orders.
  const remaining = [...withCoords];
  while (remaining.length > 0) {
    const bundle = [remaining.shift()];
    while (bundle.length < BUNDLE_SIZE && remaining.length > 0) {
      const ref = bundle[bundle.length - 1];
      let bestIdx = 0;
      let bestD = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = calculateDistance(
          ref.deliveryAddress.latitude,
          ref.deliveryAddress.longitude,
          remaining[i].deliveryAddress.latitude,
          remaining[i].deliveryAddress.longitude,
        );
        if (d < bestD) {
          bestD = d;
          bestIdx = i;
        }
      }
      bundle.push(remaining.splice(bestIdx, 1)[0]);
    }
    bundles.push(bundle);
  }

  // Orders without coordinates: group by city, chunk into 10s.
  const byCity: Record<string, any[]> = {};
  for (const o of withoutCoords) {
    const c = o.deliveryAddress?.city || "Unknown Area";
    (byCity[c] = byCity[c] || []).push(o);
  }
  for (const list of Object.values(byCity)) {
    for (let i = 0; i < list.length; i += BUNDLE_SIZE) {
      bundles.push(list.slice(i, i + BUNDLE_SIZE));
    }
  }

  return bundles.map((b, idx) => ({
    id: `B${idx + 1}`,
    label: `Bundle ${idx + 1}`,
    area: b[0]?.deliveryAddress?.city || "Mixed",
    count: b.length,
    ready: b.length >= BUNDLE_SIZE,
    orderIds: b.map((o) => String(o._id)),
    orders: b,
  }));
}

/** Notify a driver (in-app bell + FCM push) that a route was assigned to them. */
async function notifyDriverAssigned(driverId: any, route: any) {
  try {
    await sendNotification(
      "Delivery",
      String(driverId),
      "🚚 New Route Assigned",
      `Route ${route.routeNumber} (${route.totals?.orderCount ?? 0} stops) on vehicle ${route.vehicle?.vehicleNumber}. Tap to review and accept.`,
      { type: "Order", priority: "High", link: "/delivery/route/today" },
    );
  } catch (e: any) {
    console.error("Route-assignment notification failed:", e?.message);
  }
}

/**
 * Route Planning controller (Phase 2) — shared by Warehouse Head and Admin.
 *
 * Turns "Confirmed" orders into vehicle routes (min N stops). Additive: does
 * not change the existing on-demand delivery flow.
 */

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * GET /routes/unplanned-orders
 * Confirmed orders that are not yet attached to any route, grouped by area (city).
 */
export const getUnplannedOrders = asyncHandler(
  async (_req: Request, res: Response) => {
    // Orders already attached to a route
    const usedOrderIds = await RouteStop.find().distinct("order");

    // Plannable = fresh orders not yet on a route. We include "Received"
    // (newly placed) and "Confirmed" (explicitly confirmed by sales).
    const orders = await Order.find({
      status: { $in: ["Received", "Confirmed", "Accepted", "Pending", "Processed"] },
      _id: { $nin: usedOrderIds },
    })
      .select(
        "orderNumber customerName customerPhone deliveryAddress total status orderDate items",
      )
      .sort({ orderDate: -1 }) // newest orders first
      .lean();

    // Group by city (newest-first preserved within each group)
    const groups: Record<string, any[]> = {};
    for (const o of orders) {
      const city = (o as any).deliveryAddress?.city || "Unknown Area";
      if (!groups[city]) groups[city] = [];
      groups[city].push(o);
    }

    // Suggested bundles of 10 (nearest-neighbour / same area)
    const bundles = buildBundles(orders);

    res.json({
      success: true,
      data: {
        total: orders.length,
        bundleSize: BUNDLE_SIZE,
        bundles,
        groups: Object.entries(groups)
          .map(([area, items]) => ({
            area,
            count: items.length,
            orders: items,
          }))
          .sort((a, b) => {
            const da = new Date((b.orders[0] as any)?.orderDate || 0).getTime();
            const db = new Date((a.orders[0] as any)?.orderDate || 0).getTime();
            return da - db;
          }),
      },
    });
  },
);

/**
 * GET /routes/drivers — active drivers for the assignment dropdown.
 */
export const getDrivers = asyncHandler(async (_req: Request, res: Response) => {
  const drivers = await Delivery.find({ status: "Active" })
    .select("name mobile vehicleNumber vehicleType isPartner")
    .sort({ name: 1 })
    .lean();
  res.json({ success: true, data: drivers });
});

/**
 * POST /routes/confirm-order/:orderId
 * Marks an order as "Confirmed" (Phase 1 of the daily flow).
 */
export const confirmOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      res.status(400).json({ success: false, message: "Invalid order id" });
      return;
    }
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    order.status = "Confirmed";
    await order.save();
    res.json({ success: true, message: "Order confirmed", data: { id: order._id, status: order.status } });
  },
);

/**
 * POST /routes
 * Create a route from a list of confirmed orders (in stop sequence).
 * Body: { date?, vehicle:{vehicleNumber,vehicleType,isPartner}, driver?, orderIds:[] }
 */
export const createRoute = asyncHandler(
  async (req: Request, res: Response) => {
    const { routeName, date, vehicle, driver, orderIds } = req.body;

    if (!routeName?.trim()) {
      res.status(400).json({ success: false, message: "Route name is required" });
      return;
    }
    if (!vehicle?.vehicleNumber) {
      res.status(400).json({ success: false, message: "vehicle.vehicleNumber is required" });
      return;
    }
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      res.status(400).json({ success: false, message: "orderIds (array) is required" });
      return;
    }

    // Min orders per route (configurable, default 10)
    const settings = await (AppSettings as any).getSettings();
    const minOrders = settings?.minOrdersPerRoute ?? 10;
    if (orderIds.length < minOrders) {
      res.status(400).json({
        success: false,
        message: `A route needs at least ${minOrders} orders (got ${orderIds.length}).`,
      });
      return;
    }

    // Reject orders already attached to another route
    const already = await RouteStop.find({ order: { $in: orderIds } }).distinct("order");
    if (already.length > 0) {
      res.status(409).json({
        success: false,
        message: `${already.length} order(s) are already in another route.`,
      });
      return;
    }

    // Load the orders
    const orders = await Order.find({ _id: { $in: orderIds } }).lean();
    if (orders.length !== orderIds.length) {
      res.status(400).json({ success: false, message: "Some orders were not found." });
      return;
    }
    const orderMap = new Map(orders.map((o) => [String(o._id), o]));

    // Real per-order weight from product weights (Σ qty × product.weight)
    const weightMap = await computeOrderWeights(orderIds);

    // Create the route shell
    const route = await DeliveryRoute.create({
      routeName: routeName.trim(),
      date: date ? new Date(date) : startOfToday(),
      status: driver ? "Assigned" : "Planned",
      vehicle: {
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        isPartner: !!vehicle.isPartner,
      },
      driver: driver || undefined,
      totals: { orderCount: 0, totalWeight: 0, estimatedTimeMins: 0 },
      timeline: { plannedAt: new Date(), ...(driver ? { assignedAt: new Date() } : {}) },
      createdBy: (req as any).user?.userId,
      createdByModel: (req as any).user?.userType === "Admin" ? "Admin" : "Warehouse",
    });

    // Build stops in the given order sequence
    let totalWeight = 0;
    let totalInvoice = 0;
    const stopDocs = orderIds.map((oid: string, idx: number) => {
      const o: any = orderMap.get(String(oid));
      const addr = o.deliveryAddress || {};
      const weight = weightMap.get(String(oid)) || 0; // Σ qty × product.weight
      totalWeight += weight;
      totalInvoice += o.total || 0;
      const coords =
        addr.longitude != null && addr.latitude != null
          ? { type: "Point", coordinates: [addr.longitude, addr.latitude] }
          : undefined;
      return {
        route: route._id,
        order: o._id,
        sequence: idx + 1,
        retailer: {
          name: o.customerName,
          address: [addr.address, addr.city, addr.pincode].filter(Boolean).join(", "),
          contact: o.customerPhone,
          ...(coords ? { location: coords } : {}),
        },
        invoiceAmount: o.total || 0,
        orderWeight: weight,
        status: "Pending",
      };
    });
    const createdStops = await RouteStop.insertMany(stopDocs);

    // Link stops + totals back onto the route
    route.stops = createdStops.map((s) => s._id) as any;
    route.totals = {
      orderCount: createdStops.length,
      totalWeight,
      estimatedTimeMins: createdStops.length * 15, // simple estimate: 15 min/stop
    };
    await route.save();

    // Notify the driver immediately if one was assigned at creation.
    if (driver) {
      await notifyDriverAssigned(driver, route);
    }

    res.status(201).json({
      success: true,
      message: "Route created",
      data: { id: route._id, routeNumber: route.routeNumber, stops: createdStops.length, invoiceTotal: totalInvoice },
    });
  },
);

/**
 * GET /routes  (?date=YYYY-MM-DD&status=)
 */
export const getRoutes = asyncHandler(
  async (req: Request, res: Response) => {
    const { date, status } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (date) {
      const d = new Date(date as string);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      query.date = { $gte: d, $lt: next };
    }
    const routes = await DeliveryRoute.find(query)
      .populate("driver", "name mobile vehicleNumber isPartner")
      .sort({ date: -1, createdAt: -1 })
      .lean();
    res.json({ success: true, data: routes });
  },
);

/**
 * GET /routes/:id
 */
export const getRouteById = asyncHandler(
  async (req: Request, res: Response) => {
    const route = await DeliveryRoute.findById(req.params.id)
      .populate("driver", "name mobile vehicleNumber isPartner")
      .populate({ path: "stops", options: { sort: { sequence: 1 } } })
      .lean();
    if (!route) {
      res.status(404).json({ success: false, message: "Route not found" });
      return;
    }
    res.json({ success: true, data: route });
  },
);

/**
 * PUT /routes/:id  — edit before the route is accepted/loaded.
 * Body may include: vehicle, driver, status (e.g. set to "Assigned").
 */
export const updateRoute = asyncHandler(
  async (req: Request, res: Response) => {
    const route = await DeliveryRoute.findById(req.params.id);
    if (!route) {
      res.status(404).json({ success: false, message: "Route not found" });
      return;
    }
    if (["Accepted", "Loaded", "Out For Delivery", "Completed", "Reconciled"].includes(route.status)) {
      res.status(409).json({
        success: false,
        message: `Route can no longer be edited (status: ${route.status}).`,
      });
      return;
    }

    const { vehicle, driver } = req.body;
    if (vehicle?.vehicleNumber) {
      route.vehicle = {
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        isPartner: !!vehicle.isPartner,
      } as any;
    }
    let newlyAssigned = false;
    if (driver !== undefined) {
      const prev = route.driver ? String(route.driver) : "";
      route.driver = driver || undefined;
      if (driver) {
        route.status = "Assigned";
        route.timeline.assignedAt = new Date();
        newlyAssigned = prev !== String(driver);
      }
    }
    await route.save();

    // Notify the driver when they are (re)assigned to this route.
    if (newlyAssigned && route.driver) {
      await notifyDriverAssigned(route.driver, route);
    }

    res.json({ success: true, message: "Route updated", data: { id: route._id, status: route.status } });
  },
);

/**
 * GET /routes/live-tracking
 * Live delivery dashboard — all active routes with driver + stop progress.
 */
export const getLiveTracking = asyncHandler(
  async (_req: Request, res: Response) => {
    const activeRoutes = await DeliveryRoute.find({
      status: { $in: ["Assigned", "Accepted", "Loaded", "Out For Delivery"] },
    })
      .populate("driver", "name mobile vehicleNumber isPartner status")
      .populate({ path: "stops", options: { sort: { sequence: 1 } } })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const summary = {
      totalRoutes: activeRoutes.length,
      totalDrivers: new Set(activeRoutes.filter((r) => r.driver).map((r) => String((r.driver as any)?._id))).size,
      totalStops: activeRoutes.reduce((s, r) => s + (r.stops?.length || 0), 0),
      deliveredStops: activeRoutes.reduce((s, r) => s + ((r.stops as any[])?.filter((st) => st.status === "Delivered").length || 0), 0),
      pendingStops: activeRoutes.reduce((s, r) => s + ((r.stops as any[])?.filter((st) => st.status === "Pending").length || 0), 0),
    };

    const routes = activeRoutes.map((r) => {
      const stops = (r.stops || []) as any[];
      const delivered = stops.filter((s) => s.status === "Delivered").length;
      const total = stops.length;
      const totalCollected = stops
        .filter((s) => s.payment?.status === "Collected")
        .reduce((sum, s) => sum + (s.payment?.amountReceived || 0), 0);
      const totalInvoice = stops.reduce((sum, s) => sum + (s.invoiceAmount || 0), 0);

      return {
        _id: r._id,
        routeName: (r as any).routeName || "",
        routeNumber: r.routeNumber,
        status: r.status,
        date: r.date,
        vehicle: r.vehicle,
        driver: r.driver,
        progress: { delivered, total, percentage: total > 0 ? Math.round((delivered / total) * 100) : 0 },
        collection: { collected: totalCollected, total: totalInvoice },
        timeline: r.timeline,
        stops: stops.map((s) => ({
          _id: s._id,
          sequence: s.sequence,
          status: s.status,
          retailer: s.retailer,
          invoiceAmount: s.invoiceAmount,
          arrivedAt: s.arrivedAt,
          deliveredAt: s.deliveredAt,
          payment: s.payment,
        })),
      };
    });

    res.json({ success: true, data: { summary, routes } });
  },
);
