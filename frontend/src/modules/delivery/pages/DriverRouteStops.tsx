import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points.map(p => L.latLng(p[0], p[1]))), { padding: [30, 30], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [map, points]);
  return null;
}
import DeliveryBottomNav from "../components/DeliveryBottomNav";
import { getTodayRoute, DriverRoute, DriverStop } from "../../../services/api/delivery/driverRouteService";

function stopIcon(seq: number, status: string) {
  const bg = status === "Delivered" ? "#16a34a" : status === "Arrived" ? "#f59e0b" : "#6b7280";
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)">${seq}</div>`,
  });
}

function getCoords(stop: DriverStop): [number, number] | null {
  const loc = stop.retailer?.location;
  if (loc?.coordinates && loc.coordinates.length === 2) {
    return [loc.coordinates[1], loc.coordinates[0]];
  }
  return null;
}

export default function DriverRouteStops() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setRoute(await getTodayRoute());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const statusColor: Record<string, string> = {
    Pending: "bg-neutral-100 text-neutral-600",
    Arrived: "bg-amber-100 text-amber-700",
    Delivered: "bg-green-100 text-green-700",
    Partial: "bg-orange-100 text-orange-700",
    Failed: "bg-red-100 text-red-700",
  };

  const stops = route?.stops || [];
  const done = stops.filter((s) => s.status === "Delivered").length;
  const allDone = stops.length > 0 && done === stops.length;

  const mapPoints = stops.map((s) => getCoords(s)).filter(Boolean) as [number, number][];
  const showMap = mapPoints.length >= 2;
  const center: [number, number] = mapPoints.length > 0
    ? [mapPoints.reduce((s, p) => s + p[0], 0) / mapPoints.length, mapPoints.reduce((s, p) => s + p[1], 0) / mapPoints.length]
    : [22.72, 75.87];

  return (
    <div className="min-h-screen bg-neutral-100 pb-24">
      <div className="bg-white px-4 py-4 border-b border-neutral-200 sticky top-0 z-20">
        <h1 className="text-base font-bold text-neutral-900">Route Stops</h1>
        {route && (
          <p className="text-neutral-500 text-xs">
            {route.routeNumber} · {done}/{stops.length} delivered
          </p>
        )}
      </div>

      {/* Map */}
      {showMap && (
        <div className="h-72 w-full relative z-10">
          <MapContainer center={center} zoom={13} className="h-full w-full" scrollWheelZoom={true} zoomControl={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {stops.map((s) => {
              const pos = getCoords(s);
              if (!pos) return null;
              return (
                <Marker key={s._id} position={pos} icon={stopIcon(s.sequence, s.status)}>
                  <Popup>
                    <strong>Stop {s.sequence}</strong><br />
                    {s.retailer.name}<br />
                    <span style={{ fontSize: 11 }}>{s.retailer.address}</span>
                  </Popup>
                </Marker>
              );
            })}
            <FitBounds points={mapPoints} />
            <Polyline positions={mapPoints} color="#16a34a" weight={3} opacity={0.7} dashArray="8 4" />
          </MapContainer>
        </div>
      )}

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-neutral-500 py-10">Loading…</p>
        ) : !route ? (
          <p className="text-center text-neutral-500 py-10">No active route.</p>
        ) : (
          <>
            {stops.map((s) => {
              const isDone = s.status === "Delivered";
              return (
                <div
                  key={s._id}
                  onClick={() => navigate(`/delivery/stop/${s._id}`)}
                  className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer active:scale-[0.99] transition-transform ${isDone ? "border-green-200 opacity-70" : "border-neutral-200"}`}>
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isDone ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-700"}`}>
                        {s.sequence}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 text-sm truncate">{s.retailer.name}</p>
                        <p className="text-neutral-500 text-xs truncate">{s.retailer.address}</p>
                        {s.retailer.contact && (
                          <p className="text-neutral-500 text-xs">📞 {s.retailer.contact}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor[s.status]}`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pl-10">
                    <span className="text-neutral-900 font-bold text-sm">₹ {s.invoiceAmount ?? 0}</span>
                    {!isDone && <span className="text-green-600 text-xs font-medium">Tap to deliver →</span>}
                  </div>
                </div>
              );
            })}

            {allDone && (
              <button
                onClick={() => navigate(`/delivery/route/${route._id}/complete`)}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-sm active:bg-green-700 mt-2">
                Complete Route
              </button>
            )}
          </>
        )}
      </div>

      <DeliveryBottomNav />
    </div>
  );
}
