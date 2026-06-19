import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import DeliveryBottomNav from "../components/DeliveryBottomNav";
import {
  getTodayRoute,
  arriveAtStop,
  deliverStop,
  sendStopOtp,
  confirmStop,
  recordPayment,
  recordAssets,
  getOrderReturns,
  verifyReturnOtp,
  DriverStop,
} from "../../../services/api/delivery/driverRouteService";

const ASSET_TYPES = ["Fish Crate", "Ice Box", "Thermocol Box", "Plastic Tub"];

const driverIcon = L.divIcon({
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">🚚</div>`,
});
const shopIcon = L.divIcon({
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:#dc2626;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);transform:rotate(-45deg)"><span style="transform:rotate(45deg)">📍</span></div>`,
});

function FitMapBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (points.length >= 2 && !fitted.current) {
      map.fitBounds(L.latLngBounds(points.map(p => L.latLng(p[0], p[1]))), { padding: [40, 40], maxZoom: 15 });
      fitted.current = true;
    } else if (points.length === 1 && !fitted.current) {
      map.setView(points[0], 15);
      fitted.current = true;
    }
  }, [map, points]);
  return null;
}

function UpdateDriverMarker({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(pos, { animate: true, duration: 0.5 });
  }, [map, pos]);
  return null;
}

export default function DriverStopDetail() {
  const { stopId } = useParams();
  const navigate = useNavigate();
  const [stop, setStop] = useState<DriverStop | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [paid, setPaid] = useState(false);
  const [payMethod, setPayMethod] = useState<"Cash" | "UPI" | "Bank Transfer">("Cash");
  const [payAmount, setPayAmount] = useState("");
  const [payRef, setPayRef] = useState("");
  const [assetType, setAssetType] = useState(ASSET_TYPES[0]);
  const [assetQty, setAssetQty] = useState("");
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const watchRef = useRef<number | null>(null);

  // Returns
  const [returns, setReturns] = useState<any[]>([]);
  const [returnOtp, setReturnOtp] = useState("");
  const [returnBusy, setReturnBusy] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const route = await getTodayRoute();
      const s = route?.stops.find((x) => x._id === stopId) || null;
      setStop(s);
      if (s?.payment?.status === "Collected") setPaid(true);
      // Load returns if delivered
      if (s?.status === "Delivered" && s?.order) {
        try {
          const retRes = await getOrderReturns(s.order);
          setReturns(retRes?.data || []);
        } catch { setReturns([]); }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [stopId]);

  // Live GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => setDriverPos([p.coords.latitude, p.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 },
    );
    return () => { if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  // Redirect delivered stops to the verification/return page
  useEffect(() => {
    if (stop?.status === "Delivered" && stop?.order) {
      navigate(`/delivery/orders/${stop.order}/inspection`, { replace: true });
    }
  }, [stop, navigate]);

  const flash = (text: string, type: "success" | "error") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const isPrepaid = stop?.orderPayment?.method && stop.orderPayment.method !== "COD" && stop.orderPayment.method !== "Cash on Delivery";
  const isPrepaidDone = isPrepaid && stop?.orderPayment?.status === "Paid";

  const handleArrive = async () => {
    if (!stopId) return;
    try {
      setBusy(true);
      const coords = await new Promise<{ latitude?: number; longitude?: number }>((resolve) => {
        if (!navigator.geolocation) return resolve({});
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
          () => resolve({}),
          { timeout: 5000 },
        );
      });
      await arriveAtStop(stopId, coords);
      await load();
      flash("Marked arrived", "success");
    } catch (e: any) {
      flash(e?.response?.data?.message || "Failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDeliver = async () => {
    if (!stopId) return;
    try {
      setBusy(true);
      const res = await deliverStop(stopId);
      setItems(res?.data?.items || []);
      flash("Items loaded — verify with customer", "success");
    } catch (e: any) {
      flash(e?.response?.data?.message || "Failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handlePaymentQuick = async () => {
    if (!stopId) return;
    try {
      setBusy(true);
      await recordPayment(stopId, { method: "Cash", amount: Number(stop?.invoiceAmount || 0) });
      setPaid(true);
      flash("Cash collected", "success");
    } catch (e: any) {
      flash(e?.response?.data?.message || "Failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handlePayment = async () => {
    if (!stopId) return;
    if (!payAmount || Number(payAmount) <= 0) return flash("Enter a valid amount", "error");
    if (payMethod !== "Cash" && !payRef) return flash("Reference number required", "error");
    try {
      setBusy(true);
      await recordPayment(stopId, {
        method: payMethod,
        amount: Number(payAmount),
        referenceNo: payMethod !== "Cash" ? payRef : undefined,
      });
      setPaid(true);
      flash("Payment collected", "success");
    } catch (e: any) {
      flash(e?.response?.data?.message || "Failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleSendOtp = async () => {
    if (!stopId) return;
    try {
      setBusy(true);
      const res = await sendStopOtp(stopId);
      setOtpSent(true);
      flash(res?.message || "OTP sent to customer", "success");
    } catch (e: any) {
      flash(e?.response?.data?.message || "Failed to send OTP", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!stopId || !otp.trim()) {
      flash("Enter the OTP from customer", "error");
      return;
    }
    try {
      setBusy(true);
      await confirmStop(stopId, { method: "OTP", otp: otp.trim() });
      flash("Delivery confirmed!", "success");
      await load();
    } catch (e: any) {
      flash(e?.response?.data?.message || "Failed to confirm", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleReturnOtp = async (retId: string) => {
    if (!returnOtp.trim()) {
      flash("Enter the return OTP", "error");
      return;
    }
    try {
      setReturnBusy(true);
      const res = await verifyReturnOtp(retId, returnOtp.trim());
      flash(res?.message || "Return confirmed & refunded", "success");
      setReturnOtp("");
      await load();
    } catch (e: any) {
      flash(e?.response?.data?.message || "Failed to verify return OTP", "error");
    } finally {
      setReturnBusy(false);
    }
  };

  const handleAssets = async () => {
    if (!stopId) return;
    try {
      setBusy(true);
      await recordAssets(stopId, { type: assetType, qtyCollected: Number(assetQty) || 0 });
      setAssetQty("");
      flash(`${assetType} collected`, "success");
    } catch (e: any) {
      flash(e?.response?.data?.message || "Failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center pb-20">
        <p className="text-neutral-500">Loading…</p>
        <DeliveryBottomNav />
      </div>
    );
  }
  if (!stop) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center pb-20">
        <p className="text-neutral-500">Stop not found</p>
        <DeliveryBottomNav />
      </div>
    );
  }

  const paymentDone = paid || isPrepaidDone;
  const statusColor: Record<string, string> = {
    Pending: "bg-neutral-100 text-neutral-700",
    Arrived: "bg-amber-100 text-amber-700",
    Delivered: "bg-green-100 text-green-700",
  };

  const approvedReturns = returns.filter((r) => r.status === "Approved");
  const pendingReturns = returns.filter((r) => r.status === "Pending");
  const refundedReturns = returns.filter((r) => r.status === "REFUNDED");

  return (
    <div className="min-h-screen bg-neutral-100 pb-24">
      {/* Header */}
      <div className="bg-white px-3 py-3 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-neutral-100 rounded-full shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-neutral-900 truncate">Stop {stop.sequence}: {stop.retailer.name}</h1>
              <p className="text-neutral-500 text-[11px] truncate">{stop.retailer.address}</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${statusColor[stop.status] || "bg-neutral-100 text-neutral-700"}`}>
            {stop.status}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1.5 pl-7">
          <div className="flex items-center gap-2">
            <span className="text-neutral-900 font-bold">₹{stop.invoiceAmount ?? 0}</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isPrepaid ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
              {isPrepaid ? "Online" : "Cash"}
            </span>
          </div>
          {stop.retailer.contact && (
            <a href={`tel:${stop.retailer.contact}`} className="text-green-700 text-[11px] font-medium">
              📞 {stop.retailer.contact}
            </a>
          )}
        </div>
      </div>

      {/* Live Map: Driver → Shop */}
      {(() => {
        const loc = stop.retailer?.location;
        const shopPos: [number, number] | null = loc?.coordinates?.length === 2 ? [loc.coordinates[1], loc.coordinates[0]] : null;
        if (!shopPos && !driverPos) return null;
        const mapPoints: [number, number][] = [];
        if (driverPos) mapPoints.push(driverPos);
        if (shopPos) mapPoints.push(shopPos);
        const center = mapPoints[0] || [22.72, 75.87];
        return (
          <div className="h-48 w-full relative z-10">
            <MapContainer center={center} zoom={14} className="h-full w-full" scrollWheelZoom={true} zoomControl={true}>
              <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {mapPoints.length >= 2 && <FitMapBounds points={mapPoints} />}
              {driverPos && (
                <>
                  <Marker position={driverPos} icon={driverIcon} />
                  <UpdateDriverMarker pos={driverPos} />
                </>
              )}
              {shopPos && <Marker position={shopPos} icon={shopIcon} />}
              {driverPos && shopPos && (
                <Polyline positions={[driverPos, shopPos]} color="#2563eb" weight={4} opacity={0.8} dashArray="8 6" />
              )}
            </MapContainer>
          </div>
        );
      })()}

      <div className="px-3 py-3 space-y-2.5">
        {msg && (
          <div className={`px-3 py-2 rounded-lg text-xs font-medium ${
            msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>{msg.text}</div>
        )}

        {/* ═══ DELIVERED ═══ */}
        {stop.status === "Delivered" ? (
          <>
            <div className="bg-green-50 text-green-700 rounded-lg px-3 py-2 text-center text-sm font-bold">
              ✓ Delivered · {isPrepaid ? "Paid Online" : `Cash ₹${stop.invoiceAmount}`}
            </div>

            {/* Returns */}
            {(approvedReturns.length > 0 || pendingReturns.length > 0 || refundedReturns.length > 0) && (
              <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
                <p className="font-bold text-neutral-900 text-xs">↩️ Returns</p>
                {pendingReturns.map((r: any) => (
                  <div key={r._id} className="bg-amber-50 rounded px-2.5 py-1.5 text-xs text-amber-700">
                    {r.orderItem?.product?.productName || "Item"} · {r.returnedQuantity} qty — Pending
                  </div>
                ))}
                {approvedReturns.map((r: any) => (
                  <div key={r._id} className="bg-blue-50 rounded-lg p-2.5 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-blue-900">{r.orderItem?.product?.productName || "Item"} · {r.returnedQuantity} qty</span>
                      <span className="text-blue-600 font-bold">Approved</span>
                    </div>
                    <div className="flex gap-2">
                      <input value={returnOtp} onChange={(e) => setReturnOtp(e.target.value)}
                        placeholder="OTP" inputMode="numeric" maxLength={4}
                        className="flex-1 px-2 py-1.5 rounded border border-blue-300 text-sm text-center font-bold focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      <button onClick={() => handleReturnOtp(r._id)} disabled={returnBusy || !returnOtp.trim()}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-bold disabled:opacity-60">
                        {returnBusy ? "…" : "Confirm"}
                      </button>
                    </div>
                  </div>
                ))}
                {refundedReturns.map((r: any) => (
                  <div key={r._id} className="bg-green-50 rounded px-2.5 py-1.5 text-xs text-green-700 flex justify-between">
                    <span>{r.orderItem?.product?.productName || "Item"} · {r.returnedQuantity} qty</span>
                    <span className="font-bold">₹{r.refundAmount?.toFixed(0) || "0"} refunded</span>
                  </div>
                ))}
              </div>
            )}

            {/* Crates */}
            <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
              <p className="font-bold text-neutral-900 text-xs">📦 Collect Crates</p>
              <div className="flex gap-2">
                <select value={assetType} onChange={(e) => setAssetType(e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded border border-neutral-300 text-xs">
                  {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
                <input type="number" value={assetQty} onChange={(e) => setAssetQty(e.target.value)} placeholder="Qty"
                  className="w-16 px-2 py-1.5 rounded border border-neutral-300 text-xs text-right" />
                <button onClick={handleAssets} disabled={busy}
                  className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-bold">Add</button>
              </div>
            </div>

            <button onClick={() => navigate(-1)}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-bold text-sm active:bg-green-700">
              Done — Back to Stops
            </button>
          </>
        ) : (
          <>
            {/* ═══ PENDING ═══ */}
            {stop.status === "Pending" && (
              <button onClick={handleArrive} disabled={busy}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-sm active:bg-green-700 disabled:opacity-60">
                {busy ? "…" : "I've Arrived at Shop"}
              </button>
            )}

            {/* ═══ ARRIVED ═══ */}
            {stop.status === "Arrived" && (
              <>
                {/* Items */}
                <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
                  <p className="font-bold text-neutral-900 text-xs">Items</p>
                  {items.length === 0 ? (
                    <button onClick={handleDeliver} disabled={busy}
                      className="w-full bg-white border border-green-300 text-green-700 py-2.5 rounded-lg font-bold text-sm">
                      {busy ? "Loading…" : "Show Items"}
                    </button>
                  ) : (
                    <>
                      {items.map((it, i) => (
                        <div key={i} className="flex justify-between text-sm px-1">
                          <span className="text-neutral-800">{it.productName || it.name}</span>
                          <span className="font-bold text-neutral-700">x{it.quantity}</span>
                        </div>
                      ))}
                      <p className="text-green-600 text-[11px] font-medium text-center">✓ Verified</p>
                    </>
                  )}
                </div>

                {/* Payment */}
                {items.length > 0 && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    {isPrepaid ? (
                      <p className="text-green-700 text-sm font-medium text-center">✓ Paid Online — ₹{stop.invoiceAmount}</p>
                    ) : paymentDone ? (
                      <p className="text-green-700 text-sm font-medium text-center">✓ Cash Collected — ₹{stop.invoiceAmount}</p>
                    ) : (
                      <button onClick={() => { setPayAmount(String(stop.invoiceAmount || 0)); handlePaymentQuick(); }} disabled={busy}
                        className="w-full bg-green-600 text-white py-2.5 rounded-lg font-bold text-sm disabled:opacity-60">
                        {busy ? "…" : `Collect ₹${stop.invoiceAmount} Cash`}
                      </button>
                    )}
                  </div>
                )}

                {/* OTP */}
                {items.length > 0 && (isPrepaid || paymentDone) && (
                  <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
                    {!otpSent ? (
                      <button onClick={handleSendOtp} disabled={busy}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm">
                        {busy ? "Sending…" : "Send OTP to Customer"}
                      </button>
                    ) : (
                      <>
                        <p className="text-blue-600 text-[11px] text-center">OTP sent — ask customer for 4-digit code</p>
                        <div className="flex gap-2">
                          <input value={otp} onChange={(e) => setOtp(e.target.value)}
                            placeholder="OTP" inputMode="numeric" maxLength={4}
                            className="flex-1 px-3 py-2 rounded border border-neutral-300 text-sm text-center font-bold focus:outline-none focus:ring-1 focus:ring-green-500" />
                          <button onClick={handleConfirm} disabled={busy || !otp.trim()}
                            className="px-5 py-2 bg-green-600 text-white rounded font-bold text-sm disabled:opacity-60">
                            {busy ? "…" : "Confirm"}
                          </button>
                        </div>
                        <button onClick={handleSendOtp} disabled={busy}
                          className="w-full text-blue-600 text-[11px] font-medium py-1">Resend</button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <DeliveryBottomNav />
    </div>
  );
}
