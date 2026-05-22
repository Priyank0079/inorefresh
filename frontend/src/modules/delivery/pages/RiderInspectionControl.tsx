import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, CheckCircle, Clock, MapPin, Package, ShieldCheck, XCircle, Upload, Phone } from 'lucide-react';
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

  useEffect(() => {
    fetchOrder();
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, [id]);

  useEffect(() => {
    const isVerificationActive = order?.status === 'Verification Pending' || (order?.status === 'Delivered' && !order?.isVerifiedByCustomer);
    if (isVerificationActive && order?.inspectionExpiresAt) {
      const interval = setInterval(() => {
        const remaining = new Date(order.inspectionExpiresAt).getTime() - Date.now();
        if (remaining <= 0) {
          clearInterval(interval);
          setTimeLeft(0);
          fetchOrder(); // Auto-refresh order state (triggers backend check)
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

  const handleStartInspection = async () => {
    if (!currentLocation) {
      return toast.error("Waiting for GPS location...");
    }

    try {
      const res = await api.post('/returns/workflow/rider/start-inspection', {
        orderId: id,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng
      });
      if (res.data.success) {
        toast.success("Verification started. Customer notified.");
        fetchOrder();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to start verification.");
    }
  };

  const handleRiderFileUpload = async (returnId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingReturnId(returnId);
    const toastId = toast.loading("Uploading pickup proof...");
    try {
      const file = files[0];
      const result = await uploadImage(file, "returns-rider");
      const currentPhotos = pickupEvidence[returnId] || [];
      const updatedPhotos = [...currentPhotos, result.secureUrl || result.url];
      
      setPickupEvidence(prev => ({
        ...prev,
        [returnId]: updatedPhotos
      }));
      toast.success("Pickup proof uploaded!", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to upload photo", { id: toastId });
    } finally {
      setUploadingReturnId(null);
    }
  };

  const handleRiderRemovePhoto = (returnId: string, imgIdx: number) => {
    const currentPhotos = pickupEvidence[returnId] || [];
    const updatedPhotos = [...currentPhotos];
    updatedPhotos.splice(imgIdx, 1);
    setPickupEvidence(prev => ({
      ...prev,
      [returnId]: updatedPhotos
    }));
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
        fetchOrder(); // Reload order/returns
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to confirm collection", { id: toastId });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
          {order.status === 'Verification Pending' && (
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
        {['Out for Delivery', 'On the way'].includes(order.status) && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <Package className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Reached the Customer?</h2>
            <p className="text-gray-500 text-sm">
              Verify your GPS location and start order verification for the customer.
            </p>
            <button
              onClick={handleStartInspection}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
            >
              Start Order Verification
            </button>
          </div>
        )}

        {(order.status === 'Verification Pending' || (order.status === 'Delivered' && !order.isVerifiedByCustomer)) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-bold text-gray-900">Wait for customer verification</h2>
            <p className="text-sm text-gray-500 font-semibold leading-relaxed">
              The customer is verifying the order items on their app. Please wait for them to submit the details.
            </p>
            
            {timeLeft <= 0 && order.status === 'Verification Pending' && (
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

        {order.riderStatusDuringInspection === 'WAITING_FOR_RETURN_APPROVAL' && (
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
                          {ret.orderItem?.product?.name || "Returned Item"}
                        </h3>
                        <p className="text-[10px] text-gray-400">Return ID: {ret._id.slice(-8).toUpperCase()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ['COLLECTED_BY_RIDER', 'IN_TRANSIT_TO_WAREHOUSE', 'RECEIVED_AT_WAREHOUSE'].includes(ret.status)
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {['COLLECTED_BY_RIDER', 'IN_TRANSIT_TO_WAREHOUSE', 'RECEIVED_AT_WAREHOUSE'].includes(ret.status)
                          ? 'Collected'
                          : 'Pending Collection'
                        }
                      </span>
                    </div>

                    {/* Quantities/Kg to collect */}
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

                    {/* Retailer uploaded photos (Proof) */}
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

                    {/* Action / Input fields for Rider Collection */}
                    {ret.status === 'Approved' ? (
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
                          
                          <label className="flex items-center justify-center gap-2 w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer">
                            <Upload className="w-4 h-4" />
                            {uploadingReturnId === ret._id ? "Uploading Photo..." : "Add Proof Photos"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingReturnId !== null}
                              onChange={(e) => handleRiderFileUpload(ret._id, e)}
                            />
                          </label>

                          {/* Rider Photo Previews */}
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

                        {/* Wholesaler Contact / Doubt Help Box */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 space-y-2">
                          <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                            Have doubts about this return?
                          </p>
                          <p className="text-[11px] text-blue-700 leading-relaxed">
                            Rider remarks are not editable. If you notice any mismatch in weight or item condition, please call the wholesaler/seller immediately to resolve before collecting.
                          </p>
                          <a
                            href="tel:+18005550199"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] transition-all"
                          >
                            Call Wholesaler
                          </a>
                        </div>

                        {/* Confirm Collection Button */}
                        <button
                          onClick={() => handleConfirmCollection(ret._id)}
                          className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-xs"
                        >
                          Confirm Collection & Pickup
                        </button>
                      </div>
                    ) : (
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
