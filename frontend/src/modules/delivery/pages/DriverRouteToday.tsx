import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeliveryBottomNav from "../components/DeliveryBottomNav";
import { getTodayRoute, acceptRoute, DriverRoute } from "../../../services/api/delivery/driverRouteService";

/**
 * Driver "Today's Route" screen (Phase 3). Route-centric replacement for the
 * on-demand dashboard. Shows the assigned route + Accept action.
 */
export default function DriverRouteToday() {
  const navigate = useNavigate();
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setRoute(await getTodayRoute());
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Failed to load route");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAccept = async () => {
    if (!route) return;
    try {
      setBusy(true);
      await acceptRoute(route._id);
      await load();
      navigate(`/delivery/route/${route._id}/load`);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Failed to accept route");
    } finally {
      setBusy(false);
    }
  };

  const goNext = () => {
    if (!route) return;
    if (route.status === "Accepted") navigate(`/delivery/route/${route._id}/load`);
    else navigate(`/delivery/route/${route._id}/stops`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center pb-20">
        <p className="text-neutral-500">Loading route…</p>
        <DeliveryBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 pb-24">
      <div className="bg-gradient-to-br from-green-600 to-green-700 px-4 pt-6 pb-8 text-white">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/delivery")} className="p-1 hover:bg-white/20 rounded-full">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h1 className="text-lg font-bold">Today's Route</h1>
        </div>
        <p className="text-green-100 text-xs">{new Date().toDateString()}</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {msg && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-2.5 text-sm">{msg}</div>
        )}

        {!route ? (
          <div className="bg-white rounded-xl p-8 text-center border-2 border-dashed border-neutral-200">
            <p className="text-neutral-900 font-semibold text-sm">No route assigned yet</p>
            <p className="text-neutral-500 text-xs mt-1">Your warehouse will assign your route the night before.</p>
          </div>
        ) : (
          <>
          <div className="bg-white rounded-xl p-5 shadow-md">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-neutral-900 font-bold text-base">{route.routeNumber}</p>
                <p className="text-neutral-500 text-xs">{route.vehicle.vehicleNumber} · {route.vehicle.vehicleType}</p>
              </div>
              <span className="bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-green-200 uppercase">
                {route.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-4">
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-neutral-900">{route.totals.orderCount}</p>
                <p className="text-[10px] text-neutral-500">Stops</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-neutral-900">{route.totals.totalWeight}</p>
                <p className="text-[10px] text-neutral-500">Weight (kg)</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-neutral-900">{route.totals.estimatedTimeMins}</p>
                <p className="text-[10px] text-neutral-500">Est. mins</p>
              </div>
            </div>

            {route.status === "Assigned" ? (
              <button
                onClick={handleAccept}
                disabled={busy}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-sm active:bg-green-700 disabled:opacity-60">
                {busy ? "Accepting…" : "Accept Route"}
              </button>
            ) : (
              <button
                onClick={goNext}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-sm active:bg-green-700">
                {route.status === "Accepted" ? "Verify Loading" : "View Stops"}
              </button>
            )}
          </div>

          {/* Route details — stops the driver will visit */}
          {route.stops && route.stops.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm mt-4">
              <p className="font-semibold text-neutral-900 text-sm mb-3">Stops ({route.stops.length})</p>
              <div className="space-y-2">
                {route.stops.map((s) => (
                  <div key={s._id} className="flex items-start gap-3 py-1.5 border-b border-neutral-50 last:border-0">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                      {s.sequence}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 truncate">{s.retailer.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{s.retailer.address}</p>
                    </div>
                    <span className="text-sm font-bold text-neutral-900">₹{s.invoiceAmount ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>
        )}
      </div>

      <DeliveryBottomNav />
    </div>
  );
}
