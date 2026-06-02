import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Camera, CheckCircle, Clock, MapPin, Package,
  ShieldCheck, XCircle, Upload, Phone, Navigation,
  Truck, KeyRound, Building2, User, CheckCheck,
  Image as ImageIcon
} from 'lucide-react';
import api from '../../../services/api/config';
import toast from 'react-hot-toast';
import { uploadImage } from '../../../services/api/uploadService';

export default function RiderInspectionControl() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  const [returns, setReturns] = useState<any[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [uploadingReturnId, setUploadingReturnId] = useState<string | null>(null);
  const [pickupEvidence, setPickupEvidence] = useState<Record<string, string[]>>({});
  const [riderRemarks, setRiderRemarks] = useState<Record<string, string>>({});

  // OTP flow state per return item
  const [otpSentFor, setOtpSentFor] = useState<Record<string, boolean>>({});
  const [otpValues, setOtpValues] = useState<Record<string, string>>({});
  const [sendingOtpFor, setSendingOtpFor] = useState<string | null>(null);
  const [verifyingOtpFor, setVerifyingOtpFor] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, [id]);

  const handleTimeoutAccept = async () => {
    try {
      const res = await api.post(`/returns/workflow/rider/timeout-accept/${id}`);
      if (res.data.success) {
        toast.success("Verification time expired. Earnings processed automatically!");
        fetchOrder();
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  useEffect(() => {
    const isVerificationActive = (order?.status === 'Delivered' && !order?.isVerifiedByCustomer);
    if (isVerificationActive && order?.inspectionExpiresAt) {
      const interval = setInterval(() => {
        const remaining = new Date(order.inspectionExpiresAt).getTime() - Date.now();
        if (remaining <= 0) {
          clearInterval(interval);
          setTimeLeft(0);
          handleTimeoutAccept();
        } else {
          setTimeLeft(Math.floor(remaining / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [order]);

  const fetchReturns = async () => {
    try {
      setLoadingReturns(true);
      const res = await api.get(`/returns/workflow/order/${id}`);
      if (res.data.success) {
        setReturns(res.data.data);
        const evidenceMap: Record<string, string[]> = {};
        const remarksMap: Record<string, string> = {};
        res.data.data.forEach((ret: any) => {
          evidenceMap[ret._id] = ret.proofOfPickupEvidence || [];
          remarksMap[ret._id] = ret.riderRemarks || '';
        });
        setPickupEvidence(evidenceMap);
        setRiderRemarks(remarksMap);
      }
    } catch (error) {
      console.error("Failed to load return requests:", error);
    } finally {
      setLoadingReturns(false);
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/delivery/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
        if (['Partially Returned', 'Fully Returned'].includes(res.data.data.status)) {
          fetchReturns();
        }
      }
    } catch (error) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleRiderFileUpload = async (returnId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);
    for (const f of fileArr) {
      if (!f.type.startsWith("image/")) { toast.error("Please select valid image files only."); e.target.value = ''; return; }
      if (f.size > 5 * 1024 * 1024) { toast.error("Each image must be under 5MB."); e.target.value = ''; return; }
    }
    setUploadingReturnId(returnId);
    const toastId = toast.loading(`Uploading ${fileArr.length} photo${fileArr.length > 1 ? 's' : ''}...`);
    try {
      const uploaded: string[] = [];
      for (const f of fileArr) {
        const result = await uploadImage(f, "returns-rider");
        uploaded.push(result.secureUrl || result.url);
      }
      const currentPhotos = pickupEvidence[returnId] || [];
      setPickupEvidence(prev => ({ ...prev, [returnId]: [...currentPhotos, ...uploaded] }));
      toast.success(`${uploaded.length} photo${uploaded.length > 1 ? 's' : ''} uploaded!`, { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to upload photo", { id: toastId });
    } finally {
      setUploadingReturnId(null);
      e.target.value = '';
    }
  };

  const handleRiderRemovePhoto = (returnId: string, imgIdx: number) => {
    const currentPhotos = pickupEvidence[returnId] || [];
    const updatedPhotos = [...currentPhotos];
    updatedPhotos.splice(imgIdx, 1);
    setPickupEvidence(prev => ({ ...prev, [returnId]: updatedPhotos }));
    toast.success("Photo removed");
  };

  const handleConfirmCollection = async (returnId: string) => {
    const photos = pickupEvidence[returnId] || [];
    if (photos.length === 0) {
      return toast.error("Please upload Proof of Pickup Evidence (at least 1 photo of returned fish with scale/packaging)!");
    }
    const toastId = toast.loading("Submitting collection...");
    try {
      const res = await api.post(`/returns/workflow/rider/collect/${returnId}`, {
        proofOfPickupEvidence: photos,
        riderRemarks: riderRemarks[returnId] || ''
      });
      if (res.data.success) {
        toast.success("Pickup confirmed successfully!", { id: toastId });
        fetchOrder();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to confirm collection", { id: toastId });
    }
  };

  // ── OTP Flow ───────────────────────────────────────────────────────────────

  const handleSendWarehouseOtp = async (returnId: string) => {
    setSendingOtpFor(returnId);
    const toastId = toast.loading("Notifying wholeseller...");
    try {
      const res = await api.post(`/returns/workflow/rider/send-otp/${returnId}`);
      if (res.data.success) {
        setOtpSentFor(prev => ({ ...prev, [returnId]: true }));
        toast.success("OTP sent to wholeseller's mobile!", { id: toastId });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send OTP", { id: toastId });
    } finally {
      setSendingOtpFor(null);
    }
  };

  const handleVerifyWarehouseOtp = async (returnId: string) => {
    const otp = otpValues[returnId] || '';
    if (otp.length !== 4) {
      return toast.error("Please enter the 4-digit OTP");
    }
    setVerifyingOtpFor(returnId);
    const toastId = toast.loading("Verifying OTP...");
    try {
      const res = await api.post(`/returns/workflow/rider/verify-otp/${returnId}`, { otp });
      if (res.data.success) {
        toast.success("🎉 Return delivered & verified!", { id: toastId });
        fetchReturns(); // Refresh return statuses
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid OTP. Please try again.", { id: toastId });
    } finally {
      setVerifyingOtpFor(null);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const buildMapsUrl = (ret: any) => {
    const wh = ret.warehouse;
    if (wh?.location?.coordinates?.[0] && wh?.location?.coordinates?.[1]) {
      const lat = wh.location.coordinates[1];
      const lng = wh.location.coordinates[0];
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
    if (wh?.address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wh.address)}`;
    }
    return null;
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Order...</div>;
  if (!order) return <div className="p-8 text-center text-gray-500">Order not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 shadow-sm border-b">
        <div className="px-4 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Order Verification
          </h1>
          {(order.status === 'Delivered' && !order.isVerifiedByCustomer) && (
            <div className="flex items-center gap-2 px-3 py-1 bg-white/20 text-white rounded-full font-medium text-sm">
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Payout Warning Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-red-600 text-white p-4 rounded-xl shadow-md flex gap-3">
          <div className="text-2xl">⚠️</div>
          <div>
            <p className="font-bold text-sm tracking-wide">MANDATORY RIDER VERIFICATION</p>
            <p className="text-xs opacity-90 font-semibold leading-relaxed mt-0.5">
              You must verify all returned & accepted items with the customer before leaving. If verification is not completed, your delivery payout will NOT be processed!
            </p>
          </div>
        </div>

        {/* Order Meta */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</p>
              <p className="font-bold text-gray-900">{order.orderNumber}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
              {order.status}
            </span>
          </div>
          <div className="flex items-start gap-2 mt-4 pt-4 border-t border-gray-100">
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
              <p className="text-sm text-gray-600">{order.deliveryAddress?.address}, {order.deliveryAddress?.city}</p>
            </div>
          </div>
        </div>

        {/* Action Area based on Status */}
        {(order.status === 'Delivered' && !order.isVerifiedByCustomer) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-bold text-gray-900">Wait for customer verification</h2>
            <p className="text-sm text-gray-500 font-semibold leading-relaxed">
              The customer is verifying the order items on their app. Please wait for them to submit the details.
            </p>
            {timeLeft <= 0 && (order.status === 'Delivered' && !order.isVerifiedByCustomer) && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                Time expired. Proceed to normal delivery confirmation.
              </div>
            )}
          </div>
        )}

        {order.status === 'Delivered' && order.isVerifiedByCustomer && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2 text-green-600">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Verification Completed!</h2>
            <p className="text-sm text-gray-500 font-semibold">
              The customer has verified and accepted all order items. No returns to collect.
            </p>
            <div className="p-3.5 bg-green-50 rounded-xl text-xs text-green-800 font-bold border border-green-100">
              🎉 Payout secured! You can now leave the location.
            </div>
            <button
              onClick={() => navigate('/delivery/orders')}
              className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl transition-all"
            >
              Back to Deliveries
            </button>
          </div>
        )}

        {order.riderStatusDuringInspection === 'WAITING_FOR_RETURN_APPROVAL' && !['Partially Returned', 'Fully Returned'].includes(order.status) && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 text-center space-y-4">
            <Clock className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-lg font-bold text-amber-900">Waiting for Wholesaler</h2>
            <p className="text-sm text-amber-700">
              The customer has requested a return. Please wait while the wholesaler reviews the request. Do not leave the premises yet.
            </p>
          </div>
        )}

        {/* Returns Checklist and Collection UI */}
        {(order.status === 'Partially Returned' || order.status === 'Fully Returned') && (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-600" />
                Return Collection Pending
              </h2>
              <p className="text-xs text-amber-700 mt-1">
                Customer returns are approved. Please collect the specified items from the customer. You must upload Proof of Pickup Evidence for each item.
              </p>
            </div>

            {loadingReturns ? (
              <div className="text-center text-gray-500 py-4">Loading return items...</div>
            ) : returns.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-gray-500">
                No returns found to collect.
              </div>
            ) : (
              <div className="space-y-4">
                {returns.map((ret) => (
                  <div key={ret._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b pb-3 border-gray-100">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">
                          {ret.orderItem?.productName || ret.orderItem?.product?.name || "Returned Item"}
                        </h3>
                        <p className="text-[10px] text-gray-400">Return ID: {ret._id.slice(-8).toUpperCase()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ret.status === 'RECEIVED_AT_WAREHOUSE'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : ['COLLECTED_BY_RIDER', 'IN_TRANSIT_TO_WAREHOUSE'].includes(ret.status)
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {ret.status === 'RECEIVED_AT_WAREHOUSE'
                          ? '✅ Delivered'
                          : ['COLLECTED_BY_RIDER', 'IN_TRANSIT_TO_WAREHOUSE'].includes(ret.status)
                          ? 'Collected'
                          : 'Pending Collection'}
                      </span>
                    </div>

                    {/* Quantities */}
                    <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase">Ordered</p>
                        <p className="font-bold text-gray-900 mt-0.5">{ret.orderedQuantity} items/kg</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase">Accepted</p>
                        <p className="font-bold text-green-600 mt-0.5">{ret.acceptedQuantity} items/kg</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase text-red-600">MUST Collect</p>
                        <p className="font-extrabold text-red-600 mt-0.5">{ret.quantity} items/kg</p>
                      </div>
                    </div>

                    {/* Return Details */}
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-gray-700">Reason for Return:</p>
                      <p className="text-gray-600 bg-red-50/50 p-2 rounded-lg border border-red-100/50">
                        {ret.reason} {ret.description ? ` - ${ret.description}` : ''}
                      </p>
                    </div>

                    {/* Retailer Photos */}
                    {ret.images && ret.images.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-gray-700">Retailer Uploaded Photos:</p>
                        <div className="flex gap-2 flex-wrap">
                          {ret.images.map((img: string, idx: number) => (
                            <a href={img} target="_blank" rel="noreferrer" key={idx} className="block w-12 h-12 border rounded-lg overflow-hidden">
                              <img src={img} alt="retailer-proof" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── COLLECTION ACTIONS ─────────────────────────────────── */}
                    {ret.status === 'Approved' ? (
                      /* Collect from Retailer */
                      <div className="space-y-4 pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-xs font-bold text-gray-700 mb-1">
                            Proof of Pickup Evidence <span className="text-red-600">*</span>
                          </p>
                          <p className="text-[10px] text-gray-500 mb-2">
                            Please upload:<br />
                            1. Photo of returned fish with scale/packaging (Required)<br />
                            2. Weight machine photo (if possible)
                          </p>
                          {uploadingReturnId === ret._id ? (
                            <div className="flex items-center justify-center gap-2 w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-xs font-bold text-gray-600">
                              <Upload className="w-4 h-4 animate-pulse" /> Uploading Photo...
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              {/* Gallery — opens photo gallery / file picker (supports multiple) */}
                              <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer">
                                <ImageIcon className="w-4 h-4" />
                                Gallery
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  disabled={uploadingReturnId !== null}
                                  onChange={(e) => handleRiderFileUpload(ret._id, e)}
                                />
                              </label>
                              {/* Camera — opens the device camera to take a live photo */}
                              <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-teal-300 bg-teal-50/40 rounded-lg text-xs font-bold text-teal-700 hover:bg-teal-50 cursor-pointer">
                                <Camera className="w-4 h-4" />
                                Camera
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  disabled={uploadingReturnId !== null}
                                  onChange={(e) => handleRiderFileUpload(ret._id, e)}
                                />
                              </label>
                            </div>
                          )}
                          {pickupEvidence[ret._id] && pickupEvidence[ret._id].length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {pickupEvidence[ret._id].map((imgUrl: string, imgIdx: number) => (
                                <div key={imgIdx} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                                  <img src={imgUrl} alt="rider-proof" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleRiderRemovePhoto(ret._id, imgIdx)}
                                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 shadow hover:bg-red-700 flex items-center justify-center animate-bounce"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 space-y-2">
                          <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                            Have doubts about this return?
                          </p>
                          <p className="text-[11px] text-blue-700 leading-relaxed">
                            If you notice any mismatch in weight or item condition, please call the wholesaler/seller immediately to resolve before collecting.
                          </p>
                          {ret.warehouse?.mobile && (
                            <a
                              href={`tel:${ret.warehouse.mobile}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] transition-all"
                            >
                              <Phone className="w-3 h-3" /> Call Wholesaler
                            </a>
                          )}
                        </div>

                        <button
                          onClick={() => handleConfirmCollection(ret._id)}
                          className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-xs"
                        >
                          Confirm Collection & Pickup
                        </button>
                      </div>

                    ) : ret.status === 'IN_TRANSIT_TO_WAREHOUSE' ? (
                      /* ── DELIVER TO WHOLESELLER SECTION ─────────────────── */
                      <div className="pt-3 border-t border-gray-100 space-y-3">

                        {/* In Transit Banner */}
                        <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                          <Truck className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <p className="text-xs font-semibold text-green-800">Item collected — now deliver to wholeseller warehouse</p>
                        </div>

                        {/* Wholeseller Destination Card */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Return To Wholeseller</p>
                              <p className="text-sm font-bold text-indigo-900">
                                {ret.warehouse?.warehouseName || 'Warehouse'}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {ret.warehouse?.managerName && (
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                <span className="text-xs text-indigo-800 font-medium">
                                  Manager: {ret.warehouse.managerName}
                                </span>
                              </div>
                            )}
                            {ret.warehouse?.address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-indigo-800 font-medium leading-relaxed">
                                  {ret.warehouse.address}
                                </span>
                              </div>
                            )}
                            {ret.warehouse?.mobile && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                <span className="text-xs text-indigo-800 font-bold tracking-wide">
                                  {ret.warehouse.mobile}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Call & Navigate Buttons */}
                          <div className="flex gap-2 pt-1">
                            {ret.warehouse?.mobile && (
                              <a
                                href={`tel:${ret.warehouse.mobile}`}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-indigo-300 text-indigo-700 font-bold rounded-lg text-xs hover:bg-indigo-50 transition-all shadow-sm"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                Call
                              </a>
                            )}
                            {buildMapsUrl(ret) && (
                              <a
                                href={buildMapsUrl(ret)!}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-all shadow-sm"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                Navigate
                              </a>
                            )}
                          </div>
                        </div>

                        {/* OTP Section */}
                        {!otpSentFor[ret._id] ? (
                          /* Step 1: I've Arrived */
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <KeyRound className="w-4 h-4 text-amber-600" />
                              <p className="text-xs font-bold text-amber-900">Arrived at Warehouse?</p>
                            </div>
                            <p className="text-[11px] text-amber-700 leading-relaxed">
                              Once you reach the warehouse, tap the button below. The wholeseller will receive an OTP on their mobile to confirm they've received the goods.
                            </p>
                            <button
                              disabled={sendingOtpFor === ret._id}
                              onClick={() => handleSendWarehouseOtp(ret._id)}
                              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-60 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2"
                            >
                              {sendingOtpFor === ret._id ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Sending OTP...
                                </>
                              ) : (
                                <>
                                  <Truck className="w-3.5 h-3.5" />
                                  I've Arrived — Send OTP to Wholeseller
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          /* Step 2: Enter OTP */
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <CheckCheck className="w-4 h-4 text-green-600" />
                              <p className="text-xs font-bold text-green-900">OTP Sent to Wholeseller</p>
                            </div>
                            <p className="text-[11px] text-green-700 leading-relaxed">
                              Ask the wholeseller for the 4-digit OTP they received on their mobile. Enter it below to confirm delivery.
                            </p>

                            {/* OTP Input */}
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Enter OTP</p>
                              <input
                                type="number"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="_ _ _ _"
                                value={otpValues[ret._id] || ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                  setOtpValues(prev => ({ ...prev, [ret._id]: val }));
                                }}
                                className="w-full text-center text-2xl font-black tracking-[0.6em] py-3 px-4 border-2 border-green-300 focus:border-green-500 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
                              />
                            </div>

                            <button
                              disabled={verifyingOtpFor === ret._id || (otpValues[ret._id] || '').length !== 4}
                              onClick={() => handleVerifyWarehouseOtp(ret._id)}
                              className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2"
                            >
                              {verifyingOtpFor === ret._id ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Verify & Confirm Delivery
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => setOtpSentFor(prev => ({ ...prev, [ret._id]: false }))}
                              className="w-full py-1.5 text-[10px] font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              Resend OTP
                            </button>
                          </div>
                        )}
                      </div>

                    ) : ret.status === 'RECEIVED_AT_WAREHOUSE' ? (
                      /* ── DELIVERED SUCCESSFULLY ─────────────────────────── */
                      <div className="pt-3 border-t border-gray-100 space-y-3">
                        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCheck className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-blue-900">Delivered & Verified at Warehouse ✅</p>
                            <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                              The wholeseller has confirmed receipt. Your task for this return is complete.
                            </p>
                          </div>
                        </div>
                        {ret.reverseLogisticsCode && (
                          <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Logistics Code</p>
                            <p className="text-xs font-mono font-bold text-gray-700 mt-0.5">{ret.reverseLogisticsCode}</p>
                          </div>
                        )}
                      </div>

                    ) : (
                      /* Fallback: other statuses */
                      <div className="p-2.5 bg-green-50 text-green-800 rounded-lg text-xs font-semibold flex items-center gap-2 border border-green-200">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>Successfully collected & in transit to warehouse.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
