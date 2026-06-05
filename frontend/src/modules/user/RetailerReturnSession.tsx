import { useState, useEffect } from 'react';
import { compressImageFile } from '../../utils/compressImageFile';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Upload, XCircle, AlertCircle, Clock, Camera, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api/config'; // Wait, let's just mock it or assume simple fetch API
import toast from 'react-hot-toast';
import { uploadImage } from '../../services/api/uploadService';

export default function RetailerReturnSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(-1);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [acceptingAll, setAcceptingAll] = useState(false);
  const [showAcceptAllConfirm, setShowAcceptAllConfirm] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order?.inspectionExpiresAt && !order.isVerifiedByCustomer) {
      const interval = setInterval(() => {
        const remaining = new Date(order.inspectionExpiresAt).getTime() - Date.now();
        if (remaining <= 0) {
          clearInterval(interval);
          setTimeLeft(0);
          toast.error("Verification window has expired.");
          fetchOrder(); // Auto-refresh order (triggers backend check)
        } else {
          setTimeLeft(Math.floor(remaining / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [order]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customer/orders/${id}`);
      if (res.data.success) {
        const orderData = res.data.data;
        setOrder(orderData);
        // Initialize return items state
        if (orderData.items) {
          setReturnItems(orderData.items.map((item: any) => ({
            orderItemId: item._id,
            productName: item.product?.name || item.productName || 'Product',
            orderedQuantity: item.quantity,
            acceptedQuantity: item.quantity,
            returnedQuantity: 0,
            reason: '',
            comment: '',
            images: [],
            videos: []
          })));
        }
      }
    } catch (error) {
      toast.error('Failed to load order verification details');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (index: number, acceptedQty: number) => {
    const updated = [...returnItems];
    const ordered = updated[index].orderedQuantity;
    if (acceptedQty < 0 || acceptedQty > ordered) return;
    updated[index].acceptedQuantity = acceptedQty;
    updated[index].returnedQuantity = ordered - acceptedQty;
    setReturnItems(updated);
  };

  const handleReasonChange = (index: number, reason: string) => {
    const updated = [...returnItems];
    updated[index].reason = reason;
    setReturnItems(updated);
  };

  const handleCommentChange = (index: number, comment: string) => {
    const updated = [...returnItems];
    updated[index].comment = comment;
    setReturnItems(updated);
  };

  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    e.target.value = '';
    if (!files || files.length === 0) return;

    // Compress each file — converts HEIC→JPEG and shrinks large camera shots
    const fileArr = await Promise.all(Array.from(files).map((f) => compressImageFile(f)));
    for (const f of fileArr) {
      if (!f.type.startsWith("image/")) {
        toast.error("Please select valid image files only.");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error("Each image must be under 10 MB.");
        return;
      }
    }

    setUploadingIndex(index);
    const toastId = toast.loading(`Uploading ${fileArr.length} photo${fileArr.length > 1 ? 's' : ''}...`);
    try {
      const uploadedUrls: string[] = [];
      for (const f of fileArr) {
        const result = await uploadImage(f, "returns");
        uploadedUrls.push(result.secureUrl || result.url);
      }
      const updated = [...returnItems];
      updated[index].images = [...(updated[index].images || []), ...uploadedUrls];
      setReturnItems(updated);
      toast.success(`${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} uploaded!`, { id: toastId });
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || "Failed to upload photo";
      toast.error(msg, { id: toastId });
    } finally {
      setUploadingIndex(null);
      e.target.value = ''; // allow re-selecting the same file
    }
  };

  const handleRemovePhoto = (itemIndex: number, photoIndex: number) => {
    const updated = [...returnItems];
    updated[itemIndex].images.splice(photoIndex, 1);
    setReturnItems(updated);
    toast.success("Photo removed");
  };

  const handleSubmit = async () => {
    const isExpired = (order?.status === 'Delivered' && !order?.isVerifiedByCustomer) && timeLeft !== -1 && timeLeft <= 0;
    if (isExpired) {
      return toast.error("Verification time expired. Cannot submit return.");
    }
    
    // Validate
    const itemsToReturn = returnItems.filter(item => item.returnedQuantity > 0);
    const invalidItems = itemsToReturn.filter(item => !item.reason);
    const missingPhotos = itemsToReturn.filter(item => !item.images || item.images.length === 0);
    
    if (invalidItems.length > 0) {
      return toast.error("Please provide a reason for all returned items.");
    }
    if (missingPhotos.length > 0) {
      return toast.error("Please upload photo proof for all returned items.");
    }

    try {
      const payload = {
        orderId: id,
        items: itemsToReturn.map(item => ({
          orderItemId: item.orderItemId,
          acceptedQuantity: item.acceptedQuantity,
          returnedQuantity: item.returnedQuantity,
          reason: item.reason,
          comment: item.comment,
          images: item.images,
          videos: item.videos
        }))
      };

      const res = await api.post('/returns/workflow/retailer/submit', payload);
      if (res.data.success) {
        toast.success("Verification submitted successfully!");
        navigate(`/orders/${id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit return.");
    }
  };

  const handleAcceptAll = () => {
    if (acceptingAll) return;
    setShowAcceptAllConfirm(true);
  };

  const handleConfirmAcceptAll = async () => {
    setShowAcceptAllConfirm(false);
    try {
      setAcceptingAll(true);
      await api.post(`/returns/workflow/retailer/accept-all/${id}`);
      toast.success("Verification completed successfully! All items accepted.");
      navigate(`/orders/${id}`);
    } catch (err: any) {
      console.error("Error accepting all items:", err);
      toast.error(err.response?.data?.message || "Failed to complete verification");
    } finally {
      setAcceptingAll(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Verification Session...</div>;
  if (!order) return <div className="p-8 text-center">Order not found</div>;

  if (order.isVerifiedByCustomer || ((order?.status === 'Delivered' && !order?.isVerifiedByCustomer) && order?.inspectionExpiresAt && timeLeft !== -1 && timeLeft <= 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
            ✅
          </div>
          <h2 className="text-xl font-bold text-gray-900">Verification Completed</h2>
          <p className="text-gray-600 text-sm">
            This order verification window has closed or has been verified. Return requests are no longer available for this order.
          </p>
          <button
            onClick={() => navigate(`/orders/${id}`)}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition"
          >
            Go to Order Details
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm border-b">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Order Verification</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full font-medium">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-6">
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800 font-medium">
            Rider is present at your location. Please verify items before confirming delivery. After confirmation, return option will close.
          </p>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Verification Checklist</h2>
          
          {returnItems.map((item, index) => (
            <div key={item.orderItemId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                  <p className="text-sm text-gray-500">Ordered: {item.orderedQuantity} qty</p>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Accepted Qty</label>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleQuantityChange(index, item.acceptedQuantity - 1)}
                      className="w-8 h-8 rounded-full bg-white border shadow-sm flex items-center justify-center text-gray-600 font-bold"
                    >-</button>
                    <span className="font-bold text-lg w-6 text-center">{item.acceptedQuantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(index, item.acceptedQuantity + 1)}
                      className="w-8 h-8 rounded-full bg-white border shadow-sm flex items-center justify-center text-gray-600 font-bold"
                    >+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Returned Qty</label>
                  <div className="flex items-center h-8">
                    <span className={`font-bold text-lg ${item.returnedQuantity > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.returnedQuantity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Return Reason Details */}
              {item.returnedQuantity > 0 && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Reason for Return*</label>
                    <select 
                      value={item.reason}
                      onChange={(e) => handleReasonChange(index, e.target.value)}
                      className="w-full text-sm rounded-lg border-gray-300 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select reason...</option>
                      <option value="Damaged Item">Damaged Item</option>
                      <option value="Spoiled/Not Fresh">Spoiled / Not Fresh</option>
                      <option value="Wrong Item">Wrong Item Delivered</option>
                      <option value="Quality Issue">Quality Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
                    <textarea
                      value={item.comment || ''}
                      onChange={(e) => handleCommentChange(index, e.target.value)}
                      placeholder="Provide additional details about the return (optional)..."
                      className="w-full text-sm rounded-lg border-gray-300 focus:ring-red-500 focus:border-red-500 p-2"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Upload Photo proof (Required)*</label>
                    {uploadingIndex === index ? (
                      <div className="flex items-center justify-center gap-2 w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600">
                        <Upload className="w-4 h-4 animate-pulse" /> Uploading...
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {/* Gallery — opens photo gallery / file picker (supports multiple) */}
                        <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                          <ImageIcon className="w-4 h-4" />
                          Gallery
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            disabled={uploadingIndex !== null}
                            onChange={(e) => handleFileUpload(index, e)}
                          />
                        </label>
                        {/* Camera — opens the device camera to take a live photo */}
                        <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-teal-300 bg-teal-50/40 rounded-lg text-sm text-teal-700 hover:bg-teal-50 cursor-pointer">
                          <Camera className="w-4 h-4" />
                          Camera
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            disabled={uploadingIndex !== null}
                            onChange={(e) => handleFileUpload(index, e)}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Photo Previews */}
                  {item.images && item.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.images.map((imgUrl: string, imgIdx: number) => (
                        <div key={imgIdx} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                          <img src={imgUrl} alt="proof" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index, imgIdx)}
                            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 shadow hover:bg-red-700 flex items-center justify-center"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Refund Destination Info Card */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3">
          <div className="text-xl">💸</div>
          <div>
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Refund Method</p>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">
              Refunds for any approved returned items will be credited directly to your InorFresh Wallet.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-3">
          <button 
            onClick={handleSubmit}
            disabled={((order?.status === 'Delivered' && !order?.isVerifiedByCustomer) && timeLeft !== -1 && timeLeft <= 0) || acceptingAll}
            className={`w-full flex justify-center items-center gap-2 py-4 rounded-xl font-bold text-white transition-all text-sm ${
              ((order?.status === 'Delivered' && !order?.isVerifiedByCustomer) && timeLeft !== -1 && timeLeft <= 0)
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-200 active:scale-[0.98]'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Submit Return & Verification Details
          </button>

          <button 
            onClick={handleAcceptAll}
            disabled={acceptingAll}
            className="w-full flex justify-center items-center gap-2 py-4 rounded-xl font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all text-sm active:scale-[0.98] disabled:opacity-50"
          >
            <span>✅</span> No Returns? Accept All Items
          </button>
        </div>
      </div>

      {/* Accept All Confirmation Modal */}
      {showAcceptAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAcceptAllConfirm(false)} />
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10 text-center">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ✅
            </div>
            <h3 className="text-base font-bold text-neutral-800 mb-1">Accept All Items?</h3>
            <p className="text-sm text-neutral-500 mb-6">Are you sure you accept all items in this delivery with no returns?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAcceptAllConfirm(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAcceptAll}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Yes, Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
