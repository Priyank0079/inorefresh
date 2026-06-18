import { useEffect, useState } from "react";
import { getLiveTracking } from "../../../services/api/routeService";

export default function WarehouseLiveTracking() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getLiveTracking();
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const summary = data?.summary;
  const routes = data?.routes || [];

  const statusColor: Record<string, string> = {
    Assigned: "bg-blue-100 text-blue-700",
    Accepted: "bg-indigo-100 text-indigo-700",
    Loaded: "bg-amber-100 text-amber-700",
    "Out For Delivery": "bg-orange-100 text-orange-700",
  };

  const stopStatusColor: Record<string, string> = {
    Pending: "bg-neutral-100 text-neutral-600",
    Arrived: "bg-amber-100 text-amber-700",
    Delivered: "bg-green-100 text-green-700",
    Partial: "bg-orange-100 text-orange-700",
    Failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Live Delivery Tracking</h1>
            <p className="text-sm text-neutral-500">Real-time progress of all active delivery routes</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Auto-refreshes every 30s</span>
            <button onClick={load}
              className="px-4 py-2 rounded-lg bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              Refresh
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="bg-white rounded-xl p-10 text-center text-neutral-500 border border-neutral-200">Loading...</div>
        ) : (
          <>
            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl border border-neutral-200 p-4 text-center shadow-sm">
                  <p className="text-2xl font-black text-neutral-900">{summary.totalRoutes}</p>
                  <p className="text-xs text-neutral-500 font-medium">Active Routes</p>
                </div>
                <div className="bg-white rounded-xl border border-neutral-200 p-4 text-center shadow-sm">
                  <p className="text-2xl font-black text-blue-700">{summary.totalDrivers}</p>
                  <p className="text-xs text-neutral-500 font-medium">Drivers Out</p>
                </div>
                <div className="bg-white rounded-xl border border-neutral-200 p-4 text-center shadow-sm">
                  <p className="text-2xl font-black text-green-700">{summary.deliveredStops}</p>
                  <p className="text-xs text-neutral-500 font-medium">Delivered</p>
                </div>
                <div className="bg-white rounded-xl border border-neutral-200 p-4 text-center shadow-sm">
                  <p className="text-2xl font-black text-amber-600">{summary.pendingStops}</p>
                  <p className="text-xs text-neutral-500 font-medium">Pending</p>
                </div>
                <div className="bg-white rounded-xl border border-neutral-200 p-4 text-center shadow-sm">
                  <p className="text-2xl font-black text-neutral-900">{summary.totalStops}</p>
                  <p className="text-xs text-neutral-500 font-medium">Total Stops</p>
                </div>
              </div>
            )}

            {/* Routes */}
            {routes.length === 0 ? (
              <div className="bg-white rounded-xl p-10 text-center text-neutral-500 border border-neutral-200">
                No active delivery routes right now.
              </div>
            ) : (
              <div className="space-y-4">
                {routes.map((r: any) => {
                  const isExpanded = expandedRoute === r._id;
                  return (
                    <div key={r._id} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                      {/* Route header */}
                      <div
                        className="px-5 py-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                        onClick={() => setExpandedRoute(isExpanded ? null : r._id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-neutral-400 text-sm">{isExpanded ? "▼" : "▶"}</span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-neutral-900">{r.routeName || r.routeNumber}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor[r.status] || "bg-neutral-100 text-neutral-700"}`}>
                                  {r.status}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {r.routeNumber} · {r.vehicle?.vehicleNumber}
                                {r.vehicle?.isPartner && <span className="text-purple-600 ml-1">(Partner)</span>}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-black text-green-700">{r.progress.delivered}/{r.progress.total}</p>
                            <p className="text-[10px] text-neutral-500">delivered</p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${r.progress.percentage}%` }} />
                          </div>
                          <span className="text-xs font-bold text-neutral-700">{r.progress.percentage}%</span>
                        </div>

                        {/* Driver + collection */}
                        <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500">Driver:</span>
                            <span className="font-semibold text-neutral-800">
                              {(r.driver as any)?.name || "Unassigned"}
                            </span>
                            {(r.driver as any)?.mobile && (
                              <a href={`tel:${(r.driver as any).mobile}`} className="text-green-700 font-medium">
                                📞 {(r.driver as any).mobile}
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500">Collection:</span>
                            <span className="font-bold text-neutral-900">₹{r.collection.collected.toLocaleString()}</span>
                            <span className="text-neutral-400">/ ₹{r.collection.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded: stop details */}
                      {isExpanded && (
                        <div className="border-t border-neutral-200 divide-y divide-neutral-100">
                          {r.stops.map((s: any) => (
                            <div key={s._id} className="px-5 py-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.status === "Delivered" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-700"}`}>
                                  {s.sequence}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-neutral-900 truncate">{s.retailer?.name}</p>
                                  <p className="text-xs text-neutral-500 truncate">{s.retailer?.address}</p>
                                  {s.retailer?.contact && (
                                    <p className="text-xs text-neutral-400">📞 {s.retailer.contact}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0 space-y-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stopStatusColor[s.status] || "bg-neutral-100 text-neutral-600"}`}>
                                  {s.status}
                                </span>
                                <p className="text-sm font-bold text-neutral-900">₹{s.invoiceAmount ?? 0}</p>
                                {s.deliveredAt && (
                                  <p className="text-[10px] text-green-600">
                                    {new Date(s.deliveredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                                  </p>
                                )}
                                {s.payment?.status === "Collected" && (
                                  <p className="text-[10px] text-green-600 font-medium">✓ Paid</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
