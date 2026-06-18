import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DeliveryBottomNav from "../components/DeliveryBottomNav";
import { getTodayRoute, completeRoute, DriverRoute } from "../../../services/api/delivery/driverRouteService";

/**
 * Route completion summary (Phase 4): driver reviews totals and completes the
 * route. Warehouse reconciliation (Phase 5) closes the day afterwards.
 */
export default function DriverRouteComplete() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [distanceKm, setDistanceKm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getTodayRoute().then(setRoute).catch(() => {});
  }, []);

  const delivered = route?.stops.filter((s) => s.status === "Delivered").length || 0;
  const total = route?.stops.length || 0;

  const handleComplete = async () => {
    if (!id) return;
    try {
      setBusy(true);
      setMsg("");
      await completeRoute(id, distanceKm ? Number(distanceKm) : undefined);
      setDone(true);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Failed to complete route");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 pb-24">
      <div className="bg-white px-4 py-4 border-b border-neutral-200">
        <h1 className="text-base font-bold text-neutral-900">Complete Route</h1>
        {route && <p className="text-neutral-500 text-xs">{route.routeNumber}</p>}
      </div>

      <div className="px-4 py-4 space-y-4">
        {msg && <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-2.5 text-sm">{msg}</div>}

        <div className="bg-white rounded-xl p-5 shadow-sm grid grid-cols-2 gap-3">
          <div className="bg-neutral-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{delivered}</p>
            <p className="text-[11px] text-neutral-500">Delivered</p>
          </div>
          <div className="bg-neutral-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-neutral-900">{total}</p>
            <p className="text-[11px] text-neutral-500">Total Stops</p>
          </div>
        </div>

        {done ? (
          <div className="space-y-3">
            <div className="bg-green-50 text-green-700 border border-green-200 rounded-xl p-6 text-center font-semibold">
              ✓ Route completed. Return to warehouse for reconciliation.
            </div>
            <button onClick={() => navigate("/delivery/route/today")}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-sm active:bg-green-700">
              Back to Route
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <label className="text-sm text-neutral-700 block mb-1">Total distance travelled (km)</label>
              <input type="number" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} placeholder="optional"
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <button onClick={handleComplete} disabled={busy}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-sm active:bg-green-700 disabled:opacity-60">
              {busy ? "Completing…" : "Complete Route"}
            </button>
          </>
        )}
      </div>

      <DeliveryBottomNav />
    </div>
  );
}
