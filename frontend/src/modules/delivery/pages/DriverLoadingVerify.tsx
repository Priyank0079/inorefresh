import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DeliveryBottomNav from "../components/DeliveryBottomNav";
import { sendLoadingOtp, verifyLoad, startRoute } from "../../../services/api/delivery/driverRouteService";

const ASSET_TYPES = ["Fish Crate", "Ice Box", "Thermocol Box", "Plastic Tub"];

export default function DriverLoadingVerify() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [checks, setChecks] = useState({ products: false, invoices: false });
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const setAsset = (t: string, v: string) =>
    setQty((q) => ({ ...q, [t]: Math.max(0, parseInt(v) || 0) }));

  const flash = (text: string, type: "success" | "error") => setMsg({ text, type });

  const handleSendOtp = async () => {
    if (!id) return;
    try {
      setBusy(true);
      setMsg(null);
      await sendLoadingOtp(id);
      setOtpSent(true);
      flash("OTP sent to warehouse head. Ask them for the code.", "success");
    } catch (e: any) {
      flash(e?.response?.data?.message || "Failed to send OTP", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleLoad = async () => {
    if (!id) return;
    if (!checks.products || !checks.invoices) {
      flash("Please confirm products and invoices first", "error");
      return;
    }
    if (!otp.trim()) {
      flash("Enter the OTP from warehouse head", "error");
      return;
    }
    try {
      setBusy(true);
      setMsg(null);
      const assets = ASSET_TYPES.filter((t) => qty[t] > 0).map((t) => ({ type: t, qty: qty[t] }));
      await verifyLoad(id, otp.trim(), assets);
      setLoaded(true);
      flash("Vehicle loaded — OTP verified", "success");
    } catch (e: any) {
      flash(e?.response?.data?.message || "Failed to verify load", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleStart = async () => {
    if (!id) return;
    try {
      setBusy(true);
      await startRoute(id);
      navigate(`/delivery/route/${id}/stops`);
    } catch (e: any) {
      flash(e?.response?.data?.message || "Failed to start route", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 pb-24">
      <div className="bg-white px-4 py-4 border-b border-neutral-200">
        <h1 className="text-base font-bold text-neutral-900">Loading Verification</h1>
        <p className="text-neutral-500 text-xs">Check stock, crates & invoices before dispatch</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {msg && (
          <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
            msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>{msg.text}</div>
        )}

        {/* Step 1: Checklist */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <p className="font-semibold text-neutral-900 text-sm">Step 1: Verify Stock</p>
          <label className="flex items-center gap-3 text-sm text-neutral-800">
            <input type="checkbox" checked={checks.products} onChange={(e) => setChecks((c) => ({ ...c, products: e.target.checked }))} />
            All products loaded & quantity verified
          </label>
          <label className="flex items-center gap-3 text-sm text-neutral-800">
            <input type="checkbox" checked={checks.invoices} onChange={(e) => setChecks((c) => ({ ...c, invoices: e.target.checked }))} />
            Invoice count matches
          </label>
        </div>

        {/* Step 2: Returnable items */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="font-semibold text-neutral-900 text-sm mb-3">Step 2: Returnable items loaded</p>
          <div className="space-y-2">
            {ASSET_TYPES.map((t) => (
              <div key={t} className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">{t}</span>
                <input
                  type="number" min={0} value={qty[t] ?? ""}
                  onChange={(e) => setAsset(t, e.target.value)}
                  placeholder="0"
                  className="w-20 px-2 py-1 rounded-lg border border-neutral-300 text-sm text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: OTP Verification */}
        {!loaded && (
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <p className="font-semibold text-neutral-900 text-sm">Step 3: Warehouse OTP Verification</p>
            <p className="text-xs text-neutral-500">
              Get OTP from warehouse head to confirm loading is complete.
            </p>

            {!otpSent ? (
              <button
                onClick={handleSendOtp}
                disabled={busy || !checks.products || !checks.invoices}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm active:bg-blue-700 disabled:opacity-60">
                {busy ? "Sending…" : "Get OTP from Warehouse"}
              </button>
            ) : (
              <>
                <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-2 text-xs">
                  OTP sent to warehouse head. Enter the code below.
                </div>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 4-digit OTP"
                  inputMode="numeric"
                  maxLength={4}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleLoad}
                  disabled={busy}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-sm active:bg-green-700 disabled:opacity-60">
                  {busy ? "Verifying…" : "Confirm Vehicle Loaded"}
                </button>
                <button
                  onClick={handleSendOtp}
                  disabled={busy}
                  className="w-full text-blue-600 text-xs font-medium py-2">
                  Resend OTP
                </button>
              </>
            )}
          </div>
        )}

        {/* After loading verified */}
        {loaded && (
          <div className="space-y-3">
            <div className="bg-green-50 text-green-700 border border-green-200 rounded-xl px-4 py-3 text-center">
              <p className="font-bold text-sm">Vehicle Loaded — OTP Verified</p>
              <p className="text-xs mt-0.5">Ready to start delivery route</p>
            </div>
            <button
              onClick={handleStart}
              disabled={busy}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-sm active:bg-green-700 disabled:opacity-60">
              {busy ? "Starting…" : "Start Route"}
            </button>
          </div>
        )}
      </div>

      <DeliveryBottomNav />
    </div>
  );
}
