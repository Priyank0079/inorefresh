import { useEffect, useMemo, useState } from "react";
import {
  getUnplannedOrders,
  getRoutes,
  createRoute,
  getDrivers,
  UnplannedOrder,
  UnplannedGroup,
  OrderBundle,
  DeliveryRouteSummary,
  RouteDriver,
} from "../../../services/api/routeService";
import { getOrderById, OrderDetail } from "../../../services/api/orderService";

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTimeShort(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  }
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function WarehouseRoutePlanning() {
  const [groups, setGroups] = useState<UnplannedGroup[]>([]);
  const [bundles, setBundles] = useState<OrderBundle[]>([]);
  const [routes, setRoutes] = useState<DeliveryRouteSummary[]>([]);
  const [drivers, setDrivers] = useState<RouteDriver[]>([]);
  const [driverId, setDriverId] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [routeName, setRouteName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("4-Wheeler Refrigerated");
  const [isPartner, setIsPartner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  const allOrders = useMemo(() => {
    const map: Record<string, UnplannedOrder> = {};
    groups.forEach((g) => g.orders.forEach((o) => (map[o._id] = o)));
    bundles.forEach((b) => b.orders.forEach((o) => (map[o._id] = o)));
    return map;
  }, [groups, bundles]);

  const load = async () => {
    try {
      setLoading(true);
      const [unplanned, routeList, driverList] = await Promise.all([
        getUnplannedOrders(),
        getRoutes(),
        getDrivers(),
      ]);
      setGroups(unplanned.groups);
      setBundles(unplanned.bundles || []);
      setRoutes(routeList);
      setDrivers(driverList);
    } catch (e: any) {
      setMsg({ text: e?.response?.data?.message || "Failed to load planning data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected],
  );

  const toggle = (id: string) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  const toggleArea = (g: UnplannedGroup, on: boolean) =>
    setSelected((s) => {
      const next = { ...s };
      g.orders.forEach((o) => (next[o._id] = on));
      return next;
    });

  const selectBundle = (b: OrderBundle) => {
    const next: Record<string, boolean> = {};
    b.orderIds.forEach((id) => (next[id] = true));
    setSelected(next);
    setMsg({
      text: `${b.count} orders (${b.area}) selected — add vehicle/driver and Create Route.`,
      type: "success",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeFromBundle = (bundleId: string, orderId: string) => {
    setBundles((prev) =>
      prev.map((b) => {
        if (b.id !== bundleId) return b;
        const newOrders = b.orders.filter((o) => o._id !== orderId);
        const newIds = b.orderIds.filter((id) => id !== orderId);
        return { ...b, orders: newOrders, orderIds: newIds, count: newOrders.length, ready: newOrders.length >= 10 };
      }).filter((b) => b.count > 0),
    );
    setSelected((s) => { const next = { ...s }; delete next[orderId]; return next; });
  };

  const addToBundle = (bundleId: string, order: UnplannedOrder) => {
    setBundles((prev) =>
      prev.map((b) => {
        if (b.id !== bundleId || b.count >= 10 || b.orderIds.includes(order._id)) return b;
        const newOrders = [...b.orders, order];
        const newIds = [...b.orderIds, order._id];
        return { ...b, orders: newOrders, orderIds: newIds, count: newOrders.length, ready: newOrders.length >= 10 };
      }),
    );
  };

  const bundleOrderIdSet = useMemo(() => {
    const set = new Set<string>();
    const expanded = bundles.find((b) => b.id === expandedBundle);
    if (expanded) expanded.orderIds.forEach((id) => set.add(id));
    return set;
  }, [bundles, expandedBundle]);

  const availableForBundle = useMemo(() => {
    if (!expandedBundle) return [];
    const currentBundle = bundles.find((b) => b.id === expandedBundle);
    if (!currentBundle || currentBundle.count >= 10) return [];
    const bundleIds = new Set(currentBundle.orderIds);
    return Object.values(allOrders).filter((o) => !bundleIds.has(o._id));
  }, [expandedBundle, bundles, allOrders]);

  const toggleOrderDetail = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      setOrderDetail(null);
      return;
    }
    setExpandedOrder(orderId);
    setOrderDetail(null);
    setOrderDetailLoading(true);
    try {
      const res = await getOrderById(orderId);
      setOrderDetail(res.data);
    } catch {
      setOrderDetail(null);
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const handleCreate = async () => {
    setMsg(null);
    if (!routeName.trim()) {
      setMsg({ text: "Enter a route name", type: "error" });
      return;
    }
    if (!vehicleNumber.trim()) {
      setMsg({ text: "Enter a vehicle number", type: "error" });
      return;
    }
    if (selectedIds.length === 0) {
      setMsg({ text: "Select at least 1 order.", type: "error" });
      return;
    }
    if (selectedIds.length > 10) {
      setMsg({ text: `Maximum 10 orders per route (selected ${selectedIds.length}). Remove ${selectedIds.length - 10}.`, type: "error" });
      return;
    }
    try {
      setSubmitting(true);
      const res = await createRoute({
        routeName: routeName.trim(),
        vehicle: { vehicleNumber: vehicleNumber.trim(), vehicleType, isPartner },
        driver: driverId || undefined,
        orderIds: selectedIds,
      });
      const assigned = driverId ? " and assigned to driver" : " (no driver yet)";
      setMsg({ text: `Route ${res?.data?.routeNumber || ""} created with ${selectedIds.length} stops${assigned}`, type: "success" });
      setSelected({});
      setRouteName("");
      setVehicleNumber("");
      setDriverId("");
      setExpandedBundle(null);
      await load();
    } catch (e: any) {
      setMsg({ text: e?.response?.data?.message || "Failed to create route", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor: Record<string, string> = {
    Planned: "bg-neutral-100 text-neutral-700",
    Assigned: "bg-blue-100 text-blue-700",
    Accepted: "bg-indigo-100 text-indigo-700",
    Loaded: "bg-amber-100 text-amber-700",
    "Out For Delivery": "bg-orange-100 text-orange-700",
    Completed: "bg-green-100 text-green-700",
    Reconciled: "bg-emerald-100 text-emerald-800",
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Route Planning</h1>
            <p className="text-sm text-neutral-500">Group confirmed orders into vehicle routes (10 per vehicle).</p>
          </div>
          <button
            onClick={load}
            className="px-4 py-2 rounded-lg bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            Refresh
          </button>
        </div>

        {msg && (
          <div
            className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
              msg.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
            {msg.text}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl p-10 text-center text-neutral-500 border border-neutral-200">
            Loading…
          </div>
        ) : (
          <>
            {/* Create Route panel */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
              <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-semibold text-neutral-900">Create a Route</h2>
                <span className={`text-sm font-medium ${selectedIds.length === 10 ? "text-green-700" : selectedIds.length > 10 ? "text-red-600" : "text-neutral-500"}`}>
                  {selectedIds.length}/10 order(s) selected
                </span>
              </div>

              <div className="p-5 space-y-3">
                <input
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="Route Name (e.g. Indore Morning, Vijay Nagar Batch 1) *"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="grid md:grid-cols-3 gap-3">
                <input
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="Vehicle Number (e.g. MH12AB1234)"
                  className="px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>4-Wheeler Refrigerated</option>
                  <option>Tempo</option>
                  <option>Mini Truck</option>
                  <option>2-Wheeler</option>
                </select>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Assign driver (optional)</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} · {d.mobile}{d.isPartner ? " (Partner)" : ""}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                  <input type="checkbox" checked={isPartner} onChange={(e) => setIsPartner(e.target.checked)} />
                  Partner vehicle
                </label>
                </div>
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={handleCreate}
                  disabled={submitting || selectedIds.length === 0 || selectedIds.length > 10}
                  className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-60">
                  {submitting ? "Creating…" : `Create Route (${selectedIds.length}/10)`}
                </button>
              </div>
            </div>

            {/* Suggested bundles */}
            {bundles.length > 0 && (
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
                <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                  <h2 className="font-semibold text-neutral-900">Suggested Bundles (10 each)</h2>
                  <span className="text-xs text-neutral-500">nearest orders grouped automatically</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {bundles.map((b) => {
                      const isExpanded = expandedBundle === b.id;
                      return (
                        <div key={b.id} className={`rounded-lg border ${isExpanded ? "col-span-full" : ""} ${b.ready ? "border-green-300 bg-green-50/40" : "border-amber-300 bg-amber-50/40"}`}>
                          {/* Bundle header — always visible */}
                          <div
                            className="p-4 cursor-pointer"
                            onClick={() => setExpandedBundle(isExpanded ? null : b.id)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-neutral-400 text-xs">{isExpanded ? "▼" : "▶"}</span>
                                <span className="font-bold text-neutral-900 text-sm">{b.label}</span>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.ready ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                {b.count}/10
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 ml-5">📍 {b.area}</p>
                          </div>

                          {/* Expanded: order details + add/remove */}
                          {isExpanded && (
                            <div className="border-t border-neutral-200 p-4 space-y-3">
                              {/* Orders in this bundle */}
                              <div className="space-y-2">
                                {b.orders.map((o, idx) => {
                                  const isOrderOpen = expandedOrder === o._id;
                                  return (
                                    <div key={o._id} className={`bg-white rounded-lg border ${isOrderOpen ? "border-green-400 shadow-sm" : "border-neutral-200"}`}>
                                      {/* Order summary row — clickable */}
                                      <div
                                        className="px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                                        onClick={() => toggleOrderDetail(o._id)}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <span className="text-xs text-neutral-400 font-mono w-5 shrink-0 pt-0.5">{idx + 1}</span>
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="text-neutral-400 text-xs">{isOrderOpen ? "▼" : "▶"}</span>
                                                <span className="font-semibold text-neutral-900 text-sm">{o.orderNumber}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
                                                  {formatTime(o.orderDate)}
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                                                  {o.status}
                                                </span>
                                                {o.items && (
                                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                                                    {o.items.length} item(s)
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-neutral-800 text-sm font-medium">{o.customerName}</span>
                                                <span className="text-neutral-500 text-xs">📞 {o.customerPhone}</span>
                                              </div>
                                              <div className="text-neutral-500 text-xs">
                                                {o.deliveryAddress?.address}, {o.deliveryAddress?.city}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-3 shrink-0">
                                            <span className="font-bold text-neutral-900 text-sm">₹{o.total}</span>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); removeFromBundle(b.id, o._id); }}
                                              className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded hover:bg-red-50"
                                              title="Remove from bundle"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Expanded order detail panel */}
                                      {isOrderOpen && (
                                        <div className="border-t border-green-200 bg-green-50/30 px-4 py-3">
                                          {orderDetailLoading ? (
                                            <p className="text-xs text-neutral-500 text-center py-2">Loading order details...</p>
                                          ) : orderDetail ? (
                                            <div className="space-y-3">
                                              {/* Customer & delivery info */}
                                              <div className="grid sm:grid-cols-2 gap-3">
                                                <div className="bg-white rounded-lg border border-neutral-200 p-3">
                                                  <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Customer Info</p>
                                                  <p className="text-sm font-semibold text-neutral-900">{orderDetail.customerName || orderDetail.shopName}</p>
                                                  <p className="text-xs text-neutral-600">📞 {orderDetail.customerPhone}</p>
                                                  {orderDetail.customerEmail && <p className="text-xs text-neutral-600">✉ {orderDetail.customerEmail}</p>}
                                                </div>
                                                <div className="bg-white rounded-lg border border-neutral-200 p-3">
                                                  <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Delivery Address</p>
                                                  <p className="text-sm text-neutral-800">{orderDetail.deliveryAddress?.address}</p>
                                                  <p className="text-xs text-neutral-600">
                                                    {[orderDetail.deliveryAddress?.city, orderDetail.deliveryAddress?.state, orderDetail.deliveryAddress?.pincode].filter(Boolean).join(", ")}
                                                  </p>
                                                  {(orderDetail.deliveryAddress as any)?.landmark && (
                                                    <p className="text-xs text-neutral-400">Landmark: {(orderDetail.deliveryAddress as any).landmark}</p>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Order info bar */}
                                              <div className="flex flex-wrap gap-3 text-xs">
                                                <span className="px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700">
                                                  Invoice: <strong>{orderDetail.invoiceNumber}</strong>
                                                </span>
                                                <span className="px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700">
                                                  Payment: <strong>{orderDetail.paymentMethod}</strong>
                                                </span>
                                                <span className="px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700">
                                                  Pay Status: <strong>{orderDetail.paymentStatus}</strong>
                                                </span>
                                                {orderDetail.timeSlot && orderDetail.timeSlot !== "N/A" && (
                                                  <span className="px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700">
                                                    Slot: <strong>{orderDetail.timeSlot}</strong>
                                                  </span>
                                                )}
                                              </div>

                                              {/* Products table */}
                                              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                                                <div className="px-3 py-2 bg-neutral-50 border-b border-neutral-200">
                                                  <p className="text-[10px] font-bold text-neutral-500 uppercase">Products ({orderDetail.items.length})</p>
                                                </div>
                                                <div className="divide-y divide-neutral-100">
                                                  {orderDetail.items.map((item, i) => (
                                                    <div key={i} className="px-3 py-2 flex items-center justify-between gap-2">
                                                      <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-neutral-900 truncate">{item.product}</p>
                                                        <p className="text-xs text-neutral-500">
                                                          {item.unit} · ₹{item.price} x {item.qty}
                                                          {item.soldBy && item.soldBy !== "N/A" && <span className="ml-1 text-neutral-400">· {item.soldBy}</span>}
                                                        </p>
                                                      </div>
                                                      <span className="font-bold text-neutral-900 text-sm shrink-0">₹{item.subtotal}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                                <div className="px-3 py-2 bg-neutral-50 border-t border-neutral-200 flex justify-between text-sm">
                                                  <span className="text-neutral-600">Subtotal</span>
                                                  <span className="font-medium">₹{orderDetail.subtotal}</span>
                                                </div>
                                                {orderDetail.tax > 0 && (
                                                  <div className="px-3 py-1.5 flex justify-between text-xs text-neutral-500">
                                                    <span>Tax</span>
                                                    <span>₹{orderDetail.tax}</span>
                                                  </div>
                                                )}
                                                <div className="px-3 py-2 bg-green-50 border-t border-green-200 flex justify-between text-sm font-bold">
                                                  <span className="text-green-800">Grand Total</span>
                                                  <span className="text-green-800">₹{orderDetail.grandTotal}</span>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="text-xs text-red-500 text-center py-2">Failed to load order details</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Add orders (only if < 10) */}
                              {b.count < 10 && availableForBundle.length > 0 && (
                                <div className="border-t border-dashed border-neutral-300 pt-3">
                                  <p className="text-xs font-medium text-neutral-600 mb-2">
                                    Add orders ({10 - b.count} slots remaining):
                                  </p>
                                  <div className="max-h-48 overflow-y-auto space-y-1">
                                    {availableForBundle.slice(0, 20).map((o) => (
                                      <div key={o._id} className="flex items-center justify-between bg-neutral-50 rounded-lg px-3 py-2 text-sm">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-neutral-800 truncate">{o.orderNumber}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-500">
                                              {formatTimeShort(o.orderDate)}
                                            </span>
                                          </div>
                                          <span className="text-neutral-500 text-xs truncate block">{o.customerName} · {o.deliveryAddress?.city}</span>
                                        </div>
                                        <button
                                          onClick={() => addToBundle(b.id, o)}
                                          className="text-green-600 hover:text-green-800 text-xs font-bold px-2 py-1 rounded hover:bg-green-50 shrink-0"
                                        >
                                          + Add
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => selectBundle(b)}
                                  className="flex-1 py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700">
                                  Select these {b.count} for Route
                                </button>
                                <button
                                  onClick={() => setExpandedBundle(null)}
                                  className="px-4 py-2 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
                                  Close
                                </button>
                              </div>
                              {!b.ready && (
                                <p className="text-[10px] text-amber-600 text-center">Need {10 - b.count} more order(s) to reach 10</p>
                              )}
                            </div>
                          )}

                          {/* Collapsed: quick select button */}
                          {!isExpanded && (
                            <div className="px-4 pb-4">
                              <button
                                onClick={(e) => { e.stopPropagation(); selectBundle(b); }}
                                className="w-full py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700">
                                Select these {b.count}
                              </button>
                              {!b.ready && (
                                <p className="text-[10px] text-amber-600 mt-1.5 text-center">below 10 — click to edit</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Unplanned orders grouped by area */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
              <div className="px-5 py-4 border-b border-neutral-100">
                <h2 className="font-semibold text-neutral-900">Confirmed Orders (unplanned) — newest first</h2>
              </div>
              {groups.length === 0 ? (
                <div className="p-10 text-center text-neutral-500 text-sm">
                  No confirmed orders waiting to be planned.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {groups.map((g) => {
                    const allOn = g.orders.every((o) => selected[o._id]);
                    return (
                      <div key={g.area} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-neutral-800 text-sm">
                            📍 {g.area} <span className="text-neutral-400 font-normal">({g.count})</span>
                          </h3>
                          <button
                            onClick={() => toggleArea(g, !allOn)}
                            className="text-xs font-medium text-green-700 hover:underline">
                            {allOn ? "Unselect all" : "Select all"}
                          </button>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {g.orders.map((o) => (
                            <label
                              key={o._id}
                              className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer text-sm ${
                                selected[o._id]
                                  ? "border-green-400 bg-green-50"
                                  : "border-neutral-200 hover:bg-neutral-50"
                              }`}>
                              <input
                                type="checkbox"
                                className="mt-0.5"
                                checked={!!selected[o._id]}
                                onChange={() => toggle(o._id)}
                              />
                              <span className="min-w-0">
                                <span className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-neutral-900 truncate">{o.orderNumber}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
                                    {formatTimeShort(o.orderDate)}
                                  </span>
                                </span>
                                <span className="block text-neutral-600 truncate">{o.customerName}</span>
                                <span className="block text-neutral-500 text-xs truncate">
                                  {o.deliveryAddress?.address}
                                </span>
                                <span className="block text-neutral-900 font-bold text-xs mt-0.5">₹ {o.total}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Existing routes */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
              <div className="px-5 py-4 border-b border-neutral-100">
                <h2 className="font-semibold text-neutral-900">Routes</h2>
              </div>
              {routes.length === 0 ? (
                <div className="p-10 text-center text-neutral-500 text-sm">No routes yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">Route</th>
                        <th className="text-left px-4 py-2 font-medium">Vehicle</th>
                        <th className="text-left px-4 py-2 font-medium">Driver</th>
                        <th className="text-left px-4 py-2 font-medium">Stops</th>
                        <th className="text-left px-4 py-2 font-medium">Status</th>
                        <th className="text-left px-4 py-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {routes.map((r) => (
                        <tr key={r._id} className="hover:bg-neutral-50">
                          <td className="px-4 py-2">
                            <span className="font-semibold text-neutral-900 block">{r.routeName || r.routeNumber}</span>
                            <span className="text-[10px] text-neutral-400">{r.routeNumber}</span>
                          </td>
                          <td className="px-4 py-2 text-neutral-700">
                            {r.vehicle?.vehicleNumber}
                            {r.vehicle?.isPartner && (
                              <span className="ml-1 text-[10px] text-purple-600">(Partner)</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-neutral-700">{r.driver?.name || "—"}</td>
                          <td className="px-4 py-2 text-neutral-700">{r.totals?.orderCount ?? 0}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.status] || "bg-neutral-100 text-neutral-700"}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-neutral-500">
                            {new Date(r.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
