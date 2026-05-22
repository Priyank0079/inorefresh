import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../components/ui/button";
import { useOrders } from "../../hooks/useOrders";
import { OrderStatus } from "../../types/order";
import GoogleMapsTracking from "../../components/GoogleMapsTracking";
import { useDeliveryTracking } from "../../hooks/useDeliveryTracking";
import DeliveryPartnerCard from "../../components/DeliveryPartnerCard";
import { cancelOrder, updateOrderNotes, getSellerLocationsForOrder } from "../../services/api/customerOrderService";
import { parseWeight } from "../../utils/cartUtils";
import api from "../../services/api/config";

// Icon Components
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const Share2Icon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const RefreshCwIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.48L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const HomeIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const MessageSquareIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const HelpCircleIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ChefHatIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <path d="M6 13h12M6 13c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2M6 13v5c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-5" />
    <path d="M9 9V7a3 3 0 0 1 6 0v2" />
  </svg>
);

const ReceiptIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="16" y2="11" />
    <line x1="8" y1="15" x2="16" y2="15" />
  </svg>
);

const CircleSlashIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

// Animated checkmark component
const AnimatedCheckmark = ({ delay = 0 }) => (
  <motion.svg
    width="80"
    height="80"
    viewBox="0 0 80 80"
    initial="hidden"
    animate="visible"
    className="mx-auto">
    <motion.circle
      cx="40"
      cy="40"
      r="36"
      fill="none"
      stroke="#22c55e"
      strokeWidth="4"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    />
    <motion.path
      d="M24 40 L35 51 L56 30"
      fill="none"
      stroke="#22c55e"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay: delay + 0.4, ease: "easeOut" }}
    />
  </motion.svg>
);

// Promotional banner carousel
const PromoCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const promos = [
    {
      bank: "HDFC BANK",
      offer: "10% cashback on all orders",
      subtext: "Extraordinary Rewards | Zero Joining Fee | T&C apply",
      color: "from-blue-50 to-indigo-50",
    },
    {
      bank: "ICICI BANK",
      offer: "15% instant discount",
      subtext: "Valid on orders above ₹299 | Use code ICICI15",
      color: "from-orange-50 to-red-50",
    },
    {
      bank: "SBI CARD",
      offer: "Flat ₹75 off",
      subtext: "On all orders | No minimum order value",
      color: "from-purple-50 to-pink-50",
    },
    {
      bank: "AXIS BANK",
      offer: "20% cashback up to ₹100",
      subtext: "Valid on first order | T&C apply",
      color: "from-teal-50 to-cyan-50",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="bg-white rounded-xl p-4 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}>
      <div className="overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r ${promos[currentSlide].color}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold bg-blue-900 text-white px-2 py-0.5 rounded">
                  {promos[currentSlide].bank}
                </span>
              </div>
              <p className="font-semibold text-gray-900">
                {promos[currentSlide].offer}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {promos[currentSlide].subtext}
              </p>
              <button className="text-green-700 font-medium text-sm mt-2 flex items-center gap-1">
                Apply now <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-3">
        {promos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-green-600 w-4" : "bg-gray-300"
              }`}
          />
        ))}
      </div>
    </motion.div>
  );
};



// Section item component
const SectionItem = ({
  icon: Icon,
  title,
  subtitle,
  onClick,
  showArrow = true,
  rightContent,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  showArrow?: boolean;
  rightContent?: React.ReactNode;
}) => (
  <motion.button
    onClick={onClick}
    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left border-b border-dashed border-gray-200 last:border-0"
    whileTap={{ scale: 0.99 }}>
    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-gray-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-gray-900 truncate">{title}</p>
      {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
    </div>
    {rightContent ||
      (showArrow && <ChevronRightIcon className="w-5 h-5 text-gray-400" />)}
  </motion.button>
);

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confirmed = searchParams.get("confirmed") === "true";
  const { getOrderById, fetchOrderById, loading: contextLoading } = useOrders();
  const [order, setOrder] = useState<any>(id ? getOrderById(id) : undefined);
  const [loading, setLoading] = useState(!order);

  const [showConfirmation, setShowConfirmation] = useState(confirmed);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(
    order?.status || "Received"
  );
  const [estimatedTime, setEstimatedTime] = useState(29);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    durationValue: number;
    distanceValue: number;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showSpecialRequestsModal, setShowSpecialRequestsModal] =
    useState(false);

  // Form states
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedTip, setSelectedTip] = useState<number | "other" | null>(null);
  const [customTip, setCustomTip] = useState("");

  // Real-time delivery tracking via WebSocket
  const {
    deliveryLocation,
    eta,
    distance,
    status: trackingStatus,
    orderStatus: socketOrderStatus, // Real-time order status from socket
    isConnected,
    lastUpdate,
    error: trackingError,
    reconnectAttempts,
    reconnect,
  } = useDeliveryTracking(id);

  // Seller locations for the order
  const [sellerLocations, setSellerLocations] = useState<any[]>([]);
  const [loadingSellerLocations, setLoadingSellerLocations] = useState(false);
  const [returns, setReturns] = useState<any[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [acceptingAll, setAcceptingAll] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showAcceptAllConfirm, setShowAcceptAllConfirm] = useState(false);
  const [acceptAllMessage, setAcceptAllMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');
  const [instructionsError, setInstructionsError] = useState('');
  const [specialRequestsError, setSpecialRequestsError] = useState('');

  const handleAcceptAll = () => {
    if (!id || acceptingAll) return;
    setShowAcceptAllConfirm(true);
  };

  const handleConfirmAcceptAll = async () => {
    setShowAcceptAllConfirm(false);
    if (!id) return;
    try {
      setAcceptingAll(true);
      await api.post(`/returns/workflow/retailer/accept-all/${id}`);
      // Refresh order data
      await fetchOrderById(id);
      const updatedOrder = getOrderById(id);
      if (updatedOrder) {
        setOrder(updatedOrder);
        setOrderStatus(updatedOrder.status);
      }
      setAcceptAllMessage({ text: "Verification completed successfully!", type: 'success' });
      setTimeout(() => setAcceptAllMessage(null), 4000);
    } catch (err: any) {
      console.error("Error accepting all items:", err);
      setAcceptAllMessage({ text: err.response?.data?.message || "Failed to complete verification", type: 'error' });
      setTimeout(() => setAcceptAllMessage(null), 4000);
    } finally {
      setAcceptingAll(false);
    }
  };

  // Fetch order if not in context
  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;

      const existingOrder = getOrderById(id);
      if (existingOrder) {
        setOrder(existingOrder);
        setOrderStatus(existingOrder.status);
        setLoading(false);
        return;
      }

      setLoading(true);
      const fetchedOrder = await fetchOrderById(id);
      if (fetchedOrder) {
        setOrder(fetchedOrder);
        setOrderStatus(fetchedOrder.status);
      }
      setLoading(false);
    };

    loadOrder();
  }, [id, getOrderById, fetchOrderById]);

  // Timer effect for Order Verification countdown
  useEffect(() => {
    if (order?.inspectionExpiresAt && !order?.isVerifiedByCustomer) {
      const remainingTime = () => {
        const rem = new Date(order.inspectionExpiresAt).getTime() - Date.now();
        return rem <= 0 ? 0 : Math.floor(rem / 1000);
      };

      setTimeLeft(remainingTime());

      const interval = setInterval(() => {
        const rem = remainingTime();
        setTimeLeft(rem);
        if (rem <= 0) {
          clearInterval(interval);
          // Refresh order data from server (triggers auto-close if expired)
          fetchOrderById(id!).then(updatedOrder => {
            if (updatedOrder) {
              setOrder(updatedOrder);
              setOrderStatus(updatedOrder.status);
            }
          });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [order, id, fetchOrderById]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Fetch seller locations when order is loaded
  useEffect(() => {
    const fetchSellerLocations = async () => {
      if (!id || !order) return;

      // Only fetch if order has delivery boy assigned and status is before "Picked up" or "Out for Delivery"
      const shouldFetch = order.status &&
        order.status !== 'Delivered' &&
        order.status !== 'Cancelled' &&
        order.status !== 'Picked up' &&
        order.status !== 'Out for Delivery';

      if (shouldFetch) {
        try {
          setLoadingSellerLocations(true);
          const response = await getSellerLocationsForOrder(id);
          if (response.success && response.data) {
            setSellerLocations(response.data || []);
          }
        } catch (err) {
          console.error('Failed to fetch seller locations:', err);
        } finally {
          setLoadingSellerLocations(false);
        }
      }
    };

    fetchSellerLocations();
  }, [id, order?.status]);

  // Update orderStatus when order state changes
  useEffect(() => {
    if (order) {
      setOrderStatus(order.status);
    }
  }, [order]);

  // Real-time order status updates from socket
  useEffect(() => {
    if (socketOrderStatus && socketOrderStatus !== orderStatus) {
      console.log('🔄 Real-time status update:', socketOrderStatus);
      setOrderStatus(socketOrderStatus as OrderStatus);

      // Re-fetch order to get complete updated data
      if (id) {
        fetchOrderById(id).then((fetchedOrder) => {
          if (fetchedOrder) {
            setOrder(fetchedOrder);
          }
        });
      }
    }
  }, [socketOrderStatus, orderStatus, id, fetchOrderById]);

  // Fetch returns when order is in a return status
  useEffect(() => {
    const fetchOrderReturns = async () => {
      if (!id) return;
      if (['Partially Returned', 'Fully Returned', 'Return Under Review', 'Returned'].includes(orderStatus)) {
        try {
          setLoadingReturns(true);
          const res = await api.get(`/returns/workflow/order/${id}`);
          if (res.data.success) {
            setReturns(res.data.data || []);
          }
        } catch (error) {
          console.error("Failed to load return requests:", error);
        } finally {
          setLoadingReturns(false);
        }
      }
    };

    fetchOrderReturns();
  }, [id, orderStatus]);

  // Simulate order status progression
  useEffect(() => {
    if (confirmed && order) {
      const timer1 = setTimeout(() => {
        setShowConfirmation(false);
        setOrderStatus("Accepted");
      }, 3000);
      return () => clearTimeout(timer1);
    }
  }, [confirmed, order]);

  // Countdown timer
  useEffect(() => {
    if (orderStatus === "Accepted" || orderStatus === "On the way") {
      const timer = setInterval(() => {
        setEstimatedTime((prev) => Math.max(0, prev - 1));
      }, 60000);
      return () => clearInterval(timer);
    }
  }, [orderStatus]);

  // Handler functions
  const handleRefresh = async () => {
    if (!id) return;
    setIsRefreshing(true);
    const fetchedOrder = await fetchOrderById(id);
    if (fetchedOrder) {
      setOrder(fetchedOrder);
      setOrderStatus(fetchedOrder.status);
    }
    if (['Partially Returned', 'Fully Returned', 'Return Under Review', 'Returned'].includes(fetchedOrder?.status || orderStatus)) {
      try {
        const res = await api.get(`/returns/workflow/order/${id}`);
        if (res.data.success) {
          setReturns(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to refresh returns:", err);
      }
    }
    // Add a small delay for the animation
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleShare = async () => {
    const shareData = {
      title: `Order #${order?.id?.split("-").slice(-1)[0]}`,
      text: `Track my Inor Fresh order: Order #${order?.id?.split("-").slice(-1)[0]
        }`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setShareMessage("Link copied to clipboard!");
        setTimeout(() => setShareMessage(''), 2500);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleCallStore = () => {
    // Default store number, should be from order/seller data
    const storeNumber = order?.seller?.phone || "1234567890";
    window.location.href = `tel:${storeNumber}`;
  };

  const handleCancelOrder = async () => {
    if (!cancellationReason.trim()) {
      setCancelError("Please provide a cancellation reason");
      return;
    }

    if (!id) return;

    try {
      await cancelOrder(id, cancellationReason);
      setOrderStatus("Cancelled" as any);
      setCancelSuccess("Order cancelled successfully");
      setTimeout(() => {
        setCancelSuccess('');
        setShowCancelModal(false);
        handleRefresh();
      }, 1500);
    } catch (error) {
      console.error("Error cancelling order:", error);
      setCancelError("Failed to cancel order");
    }
  };

  const handleSaveInstructions = async () => {
    try {
      if (!id) return;
      await updateOrderNotes(id, { deliveryInstructions });
      setShowInstructionsModal(false);
      handleRefresh();
    } catch (error) {
      console.error("Failed to save instructions:", error);
      setInstructionsError("Failed to save instructions");
    }
  };

  const handleSaveSpecialRequests = async () => {
    try {
      if (!id) return;
      await updateOrderNotes(id, { specialRequests });
      setShowSpecialRequestsModal(false);
      handleRefresh();
    } catch (error) {
      console.error("Failed to save special requests:", error);
      setSpecialRequestsError("Failed to save special requests");
    }
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="text-sm text-neutral-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto text-center py-20">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">
            Order Not Found
          </h1>
          <Link to="/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig: Record<
    string,
    { title: string; subtitle: string; color: string }
  > = {
    Received: {
      title: "Order received",
      subtitle: "Order will reach you shortly",
      color: "bg-green-700",
    },
    Accepted: {
      title: "Preparing your order",
      subtitle: `Arriving in ${estimatedTime} mins`,
      color: "bg-green-700",
    },
    "On the way": {
      title: "Order picked up",
      subtitle: `Arriving in ${estimatedTime} mins`,
      color: "bg-green-700",
    },
    Delivered: {
      title: "Order delivered",
      subtitle: "Enjoy your meal!",
      color: "bg-green-600",
    },
    // Backend status mappings
    Pending: {
      title: "Order pending",
      subtitle: "Waiting for confirmation",
      color: "bg-yellow-600",
    },
    Processed: {
      title: "Order processed",
      subtitle: "Preparing for delivery",
      color: "bg-green-700",
    },
    Shipped: {
      title: "Order shipped",
      subtitle: "On the way to you",
      color: "bg-blue-600",
    },
    "Out for Delivery": {
      title: "Out for delivery",
      subtitle: `Arriving in ${estimatedTime} mins`,
      color: "bg-green-700",
    },
    Cancelled: {
      title: "Order cancelled",
      subtitle: "This order has been cancelled",
      color: "bg-red-600",
    },
    Returned: {
      title: "Order returned",
      subtitle: "This order has been returned",
      color: "bg-gray-600",
    },
    "Verification Pending": {
      title: "Order Verification",
      subtitle: "The rider is at your door — please verify your items",
      color: "bg-orange-600",
    },
    "Partially Returned": {
      title: "Partial Return Submitted",
      subtitle: "Awaiting wholesaler review",
      color: "bg-amber-600",
    },
    "Fully Returned": {
      title: "Full Return Requested",
      subtitle: "Awaiting wholesaler review",
      color: "bg-red-600",
    },
    "Return Under Review": {
      title: "Return Under Review",
      subtitle: "Wholesaler is reviewing your request",
      color: "bg-blue-600",
    },
  };

  const currentStatus = statusConfig[orderStatus] || statusConfig["Received"];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Order Confirmed Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-center px-8">
              <AnimatedCheckmark delay={0.3} />
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="text-2xl font-bold text-gray-900 mt-6">
                Order Confirmed!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="text-gray-600 mt-2">
                Your order has been placed successfully
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-8">
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500 mt-3">
                  Loading order details...
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Green Header */}
      <motion.div
        className={`${currentStatus.color} text-white sticky top-0 z-40`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}>
        {/* Navigation bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/orders">
            <motion.button
              className="w-10 h-10 flex items-center justify-center"
              whileTap={{ scale: 0.9 }}>
              <ArrowLeftIcon className="w-6 h-6" />
            </motion.button>
          </Link>
          <h2 className="font-semibold text-lg">Inor fresh</h2>
          <motion.button
            className="w-10 h-10 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}>
            <Share2Icon className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Status section */}
        <div className="px-4 pb-4 text-center">
          <motion.h1
            className="text-2xl font-bold mb-3"
            key={currentStatus.title}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}>
            {currentStatus.title}
          </motion.h1>

          {/* Status pill */}
          <motion.div
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}>
            <span className="text-sm">{currentStatus.subtitle}</span>
            {(orderStatus === "Accepted" || orderStatus === "On the way") && (
              <>
                <span className="w-1 h-1 rounded-full bg-white" />
                <span className="text-sm text-green-200">On time</span>
              </>
            )}
            <motion.button
              onClick={handleRefresh}
              className="ml-1"
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 0.5 }}>
              <RefreshCwIcon className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Verification Pending Banner — urgent CTA for retailer */}
      {(orderStatus === "Delivered" && !order?.isVerifiedByCustomer) && (
        <div className="mx-4 my-4 bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 text-white p-5 rounded-2xl shadow-lg border border-orange-400/20 relative z-30">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl">🚨</span>
                <p className="font-bold text-lg md:text-xl">
                  {!order?.inspectionExpiresAt 
                    ? "Rider has arrived!" 
                    : (timeLeft > 0 ? "Rider is present at your location!" : "Verification Time Expired!")}
                </p>
                {order?.inspectionExpiresAt && timeLeft > 0 && (
                  <span className="ml-2 px-3 py-1 bg-white/20 text-white font-mono text-sm font-bold rounded-full animate-pulse flex items-center gap-1.5 border border-white/10">
                    ⏱️ {formatTime(timeLeft)}
                  </span>
                )}
              </div>
              <p className="text-sm opacity-95 font-medium">
                {!order?.inspectionExpiresAt 
                  ? "Waiting for the rider to start the verification process."
                  : (timeLeft > 0 
                    ? "Please verify your items before the rider leaves." 
                    : "The verification window has closed. The order is automatically being accepted.")}
              </p>
              {order?.inspectionExpiresAt && timeLeft > 0 && <p className="text-xs opacity-80">Note: Returns cannot be requested after completing verification.</p>}
            </div>
            
            {order?.inspectionExpiresAt && timeLeft > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
                <button
                  onClick={handleAcceptAll}
                  disabled={acceptingAll}
                  className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-emerald-500/30"
                >
                  {acceptingAll ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span>✅</span> Accept All (No Returns)
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate(`/orders/${id}/inspection`)}
                  className="w-full sm:w-auto px-5 py-3 bg-white text-orange-700 font-bold rounded-xl text-sm shadow-md hover:bg-orange-50 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>🔍</span> Return / Verify Items →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accept All Message */}
      {acceptAllMessage && (
        <div className={`mx-4 mb-4 px-4 py-3 rounded-xl text-sm font-semibold text-center ${acceptAllMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {acceptAllMessage.text}
        </div>
      )}

      {/* Share Message */}
      {shareMessage && (
        <div className="fixed top-20 left-4 right-4 z-[60] bg-neutral-800 text-white text-sm font-semibold rounded-xl px-4 py-3 text-center shadow-lg">
          {shareMessage}
        </div>
      )}

      {/* Map Section */}
      {!showConfirmation && !['Delivered', 'Cancelled', 'Returned', 'Partially Returned', 'Fully Returned', 'Return Under Review'].includes(orderStatus) && (
        <GoogleMapsTracking
          sellerLocations={sellerLocations.map(s => ({
            lat: s.latitude,
            lng: s.longitude,
            name: s.storeName
          }))}
          customerLocation={{
            lat: order?.deliveryAddress?.latitude || order?.address?.latitude || 0,
            lng: order?.deliveryAddress?.longitude || order?.address?.longitude || 0,
          }}
          deliveryLocation={deliveryLocation || undefined}
          isTracking={isConnected && !!deliveryLocation}
          showRoute={
            isConnected &&
            !!deliveryLocation &&
            !['Delivered', 'Cancelled', 'Returned', 'Partially Returned', 'Fully Returned', 'Return Under Review'].includes(orderStatus)
          }
          routeOrigin={deliveryLocation || undefined}
          routeDestination={{
            lat: order?.deliveryAddress?.latitude || order?.address?.latitude || 0,
            lng: order?.deliveryAddress?.longitude || order?.address?.longitude || 0,
          }}
          routeWaypoints={
            orderStatus === 'Picked up' || orderStatus === 'Out for Delivery'
              ? []
              : sellerLocations.map(s => ({
                lat: s.latitude,
                lng: s.longitude,
              }))
          }
          destinationName={
            orderStatus === 'Picked up' || orderStatus === 'Out for Delivery'
              ? order?.deliveryAddress?.address?.split(',')[0] || order?.address?.split(',')[0] || "Delivery Address"
              : sellerLocations.length > 0
                ? "Sellers & Delivery Address"
                : "Delivery Address"
          }
          onRouteInfoUpdate={setRouteInfo}
          lastUpdate={lastUpdate}
        />
      )}

      {/* Tracking Error Display */}
      {trackingError && (
        <div className="mx-4 mt-2 px-4 py-2 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex items-center gap-2">
          <span>⚠️</span>
          <span>{trackingError}</span>
        </div>
      )}

      {/* Delivery Partner Card */}
      {(order?.deliveryPartner || order?.deliveryOtp) && !['Partially Returned', 'Fully Returned', 'Return Under Review'].includes(orderStatus) && (
        <DeliveryPartnerCard
          partner={{
            name: order?.deliveryPartner?.name || "Delivery Partner",
            phone: order?.deliveryPartner?.phone,
            profileImage: order?.deliveryPartner?.profileImage,
            vehicleNumber: order?.deliveryPartner?.vehicleNumber,
          }}
          eta={routeInfo ? Math.ceil(routeInfo.durationValue / 60) : eta}
          distance={routeInfo ? routeInfo.distanceValue : distance}
          isTracking={isConnected && !!deliveryLocation}
          deliveryOtp={
            !['Delivered', 'Cancelled', 'Returned', 'Rejected', 'Partially Returned', 'Fully Returned', 'Return Under Review'].includes(orderStatus)
              ? order?.deliveryOtp
              : undefined
          }
          onCall={() => {
            const phone = order?.deliveryPartner?.phone || "1234567890";
            window.location.href = `tel:${phone}`;
          }}
        />
      )}

      {/* Scrollable Content */}
      <div className="px-4 py-4 space-y-4 pb-24">
        {/* Return Status Dashboard */}
        {['Partially Returned', 'Fully Returned', 'Return Under Review'].includes(orderStatus) && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Main Status Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0 animate-pulse">
                  🔄
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 leading-tight">
                    {orderStatus === 'Return Under Review' ? 'Return Under Wholesaler Review' : 'Return Request Processed'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {orderStatus === 'Return Under Review' 
                      ? 'Our wholesaler is reviewing your verification & return details. Please keep items ready.'
                      : 'Wholesaler has processed the return details. See status breakdown below.'}
                  </p>
                </div>
              </div>

              {/* Steps Indicator / Stepper */}
              <div className="mt-6 pt-5 border-t border-dashed border-gray-100">
                <div className="grid grid-cols-4 gap-2 relative">
                  {/* Progress Line */}
                  <div className="absolute top-4 left-[12%] right-[12%] h-0.5 bg-gray-100 -z-10" />
                  
                  {/* Step 1 */}
                  <div className="text-center flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-emerald-100">
                      ✓
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 mt-2">Submitted</span>
                  </div>

                  {/* Step 2 */}
                  <div className="text-center flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                      orderStatus === 'Return Under Review'
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {orderStatus === 'Return Under Review' ? '2' : '✓'}
                    </div>
                    <span className={`text-[10px] font-bold mt-2 ${
                      orderStatus === 'Return Under Review' ? 'text-blue-600' : 'text-emerald-600'
                    }`}>Review</span>
                  </div>

                  {/* Step 3 */}
                  <div className="text-center flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                      orderStatus === 'Return Under Review'
                        ? 'bg-gray-100 text-gray-400'
                        : (returns.some(r => ['COLLECTED_BY_RIDER', 'IN_TRANSIT_TO_WAREHOUSE', 'RECEIVED_AT_WAREHOUSE'].includes(r.status)) ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white animate-pulse')
                    }`}>
                      {returns.some(r => ['COLLECTED_BY_RIDER', 'IN_TRANSIT_TO_WAREHOUSE', 'RECEIVED_AT_WAREHOUSE', 'REFUNDED'].includes(r.status)) ? '✓' : '3'}
                    </div>
                    <span className={`text-[10px] font-bold mt-2 ${
                      returns.some(r => ['COLLECTED_BY_RIDER', 'IN_TRANSIT_TO_WAREHOUSE', 'RECEIVED_AT_WAREHOUSE', 'REFUNDED'].includes(r.status)) ? 'text-emerald-600' : 'text-gray-400'
                    }`}>Pickup</span>
                  </div>

                  {/* Step 4 */}
                  <div className="text-center flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                      returns.length > 0 && returns.every(r => r.status === 'REFUNDED')
                        ? 'bg-emerald-600 text-white shadow-emerald-100 shadow-md'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {returns.length > 0 && returns.every(r => r.status === 'REFUNDED') ? '✓' : '4'}
                    </div>
                    <span className={`text-[10px] font-bold mt-2 ${
                      returns.length > 0 && returns.every(r => r.status === 'REFUNDED') ? 'text-emerald-600' : 'text-gray-400'
                    }`}>Refunded</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Rules Notice Card */}
            <div className="bg-gradient-to-br from-[#1FA9C6] to-[#128aa2] text-white rounded-2xl p-5 shadow-lg border border-[#48c9e5]/30 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/20 pb-3">
                <span className="text-xl">⚠️</span>
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-amber-200">Important Return Guidelines</h4>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {/* Rule 1: Approved */}
                <div className="bg-white/10 rounded-xl p-3.5 border border-white/20 hover:border-emerald-300/40 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    <p className="font-bold text-emerald-200 text-xs uppercase tracking-wide">If Approved (Warehouse Approve)</p>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed font-medium">
                    If the warehouse <strong className="text-white font-bold">approves</strong> the return request, please <strong className="text-emerald-200 font-bold">hand over the item immediately</strong> to the waiting rider.
                  </p>
                </div>

                {/* Rule 2: Rejected */}
                <div className="bg-white/10 rounded-xl p-3.5 border border-white/20 hover:border-rose-300/40 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
                    <p className="font-bold text-rose-200 text-xs uppercase tracking-wide">If Rejected (Rejected Request)</p>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed font-medium">
                    If the warehouse <strong className="text-white font-bold">rejects</strong> the return request, <strong className="text-rose-200 font-bold">no refund amount</strong> will be credited to your wallet for that item.
                  </p>
                </div>
              </div>
            </div>

            {/* Returning Items Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Return Items & Review Status</h4>
              
              {loadingReturns ? (
                <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center text-sm text-gray-500">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                  Loading item review status...
                </div>
              ) : returns.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center text-sm text-gray-500">
                  No return items details found.
                </div>
              ) : (
                <div className="space-y-4">
                  {returns.map((ret: any) => {
                    const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
                      REQUESTED: { label: "Awaiting Wholesaler Approval", color: "bg-amber-50 text-amber-700 border-amber-200", icon: "⏳" },
                      UNDER_REVIEW: { label: "Under Verification Review", color: "bg-blue-50 text-blue-700 border-blue-200", icon: "🔍" },
                      Approved: { label: "Approved - Handover to Rider", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "✅" },
                      Rejected: { label: "Rejected - No Refund Issued", color: "bg-rose-50 text-rose-700 border-rose-200", icon: "❌" },
                      COLLECTED_BY_RIDER: { label: "Collected by Rider", color: "bg-teal-50 text-teal-700 border-teal-200", icon: "🏍️" },
                      IN_TRANSIT_TO_WAREHOUSE: { label: "In Transit to Warehouse", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: "🚚" },
                      RECEIVED_AT_WAREHOUSE: { label: "Received at Warehouse", color: "bg-cyan-50 text-cyan-700 border-cyan-200", icon: "🏢" },
                      REFUNDED: { label: "Refunded to Wallet", color: "bg-emerald-500 text-white border-emerald-600 shadow-sm", icon: "💰" }
                    };

                    const currentItemStatus = statusConfig[ret.status] || { label: ret.status, color: "bg-gray-50 text-gray-700 border-gray-200", icon: "📦" };

                    return (
                      <div key={ret._id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-4">
                        {/* Item Info Header */}
                        <div className="flex gap-3 items-start border-b border-gray-50 pb-3">
                          <div className="w-14 h-14 bg-gray-50 border rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                            {ret.orderItem?.product?.mainImage ? (
                              <img src={ret.orderItem.product.mainImage} alt="product" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">🐟</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 text-sm truncate">
                              {ret.orderItem?.product?.productName || ret.orderItem?.productName || "Product"}
                            </h5>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                              <span>Ordered: <strong>{ret.orderedQuantity} qty</strong></span>
                              <span>Accepted: <strong className="text-green-600">{ret.acceptedQuantity} qty</strong></span>
                              <span>Returning: <strong className="text-red-500">{ret.quantity} qty</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Reason / Description Details */}
                        <div className="text-xs space-y-1.5 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                          <p className="font-semibold text-gray-700">Reason for Return:</p>
                          <p className="text-gray-600 font-medium">
                            {ret.reason} {ret.description ? `— "${ret.description}"` : ""}
                          </p>
                        </div>

                        {/* Retailer Photo Proofs */}
                        {ret.images && ret.images.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Uploaded Proof Photos:</p>
                            <div className="flex gap-2 flex-wrap">
                              {ret.images.map((img: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={img}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-12 h-12 rounded-lg border overflow-hidden hover:opacity-90 transition-opacity flex-shrink-0"
                                >
                                  <img src={img} alt="proof-thumbnail" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Item Approval/Rejection Action Status Badge */}
                        <div className="pt-2 border-t border-gray-50 flex flex-col gap-2">
                          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold ${currentItemStatus.color}`}>
                            <span className="text-base">{currentItemStatus.icon}</span>
                            <span className="flex-1">{currentItemStatus.label}</span>
                          </div>

                          {/* Approved Instructions */}
                          {ret.status === 'Approved' && (
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-[11px] text-emerald-800 leading-relaxed font-semibold">
                              👉 <strong>Handover to Rider</strong>: Warehouse has approved this item return request. Please handover the item to the rider immediately. Rider will scan and verify collection.
                            </div>
                          )}

                          {/* Rejection Details */}
                          {ret.status === 'Rejected' && (
                            <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-[11px] text-rose-800 leading-relaxed font-semibold space-y-1">
                              <div>❌ <strong>Return request was rejected.</strong></div>
                              {ret.rejectionReason && (
                                <div className="text-rose-700 bg-white/60 p-2 rounded-lg mt-1 font-medium border border-rose-100/50">
                                  <strong>Wholesaler Remarks</strong>: "{ret.rejectionReason}"
                                </div>
                              )}
                              <div className="mt-1 font-bold text-rose-900 bg-rose-100/30 px-2 py-0.5 rounded inline-block">
                                Note: No refund amount will be credited to your wallet for this item.
                              </div>
                            </div>
                          )}

                          {/* Refund Confirmation Card */}
                          {ret.status === 'REFUNDED' && (
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                  <span className="text-lg">💰</span>
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">Refund Credited to Wallet!</p>
                                  <p className="text-xl font-black text-emerald-600 leading-tight">
                                    ₹{(ret.refundAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                              <p className="text-[11px] text-emerald-700 font-medium leading-relaxed pl-0.5">
                                This amount has been added to your <strong>Inor Wallet</strong>. You can use it on your next order above ₹10,000.
                              </p>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Payment Pending */}
        {orderStatus !== 'Cancelled' && !['Partially Returned', 'Fully Returned', 'Return Under Review'].includes(orderStatus) && (
          <motion.div
            className="bg-white rounded-xl p-4 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  Payment of ₹{order.totalAmount?.toFixed(0) || "0"} pending
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Pay now, or pay to the delivery partner using Cash/UPI
                </p>
              </div>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6">
                Pay now <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Promo Carousel */}
        {orderStatus !== 'Cancelled' && !['Partially Returned', 'Fully Returned', 'Return Under Review'].includes(orderStatus) && <PromoCarousel />}

        {/* Delivery Partner Assignment - Only show if no partner assigned yet */}
        {orderStatus !== 'Cancelled' && !order?.deliveryPartner && !['Partially Returned', 'Fully Returned', 'Return Under Review'].includes(orderStatus) && (
          <motion.div
            className="bg-white rounded-xl p-4 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-2xl">👨‍🍳</span>
              </div>
              <p className="font-semibold text-gray-900">
                {order?.status === 'Received' || order?.status === 'Accepted'
                  ? "Assigning delivery partner shortly"
                  : "Preparing your order"}
              </p>
            </div>
          </motion.div>
        )}



        {/* Delivery Partner Safety */}
        {orderStatus !== 'Cancelled' && !['Partially Returned', 'Fully Returned', 'Return Under Review'].includes(orderStatus) && (
          <motion.button
            className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileTap={{ scale: 0.99 }}>
            <ShieldIcon className="w-6 h-6 text-gray-600" />
            <span className="flex-1 text-left font-medium text-gray-900">
              Learn about delivery partner safety
            </span>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </motion.button>
        )}

        {/* Delivery Details Banner */}
        {orderStatus !== 'Cancelled' && !['Partially Returned', 'Fully Returned', 'Return Under Review'].includes(orderStatus) && (
          <motion.div
            className="bg-yellow-50 rounded-xl p-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}>
            <p className="text-yellow-800 font-medium">
              All your delivery details in one place 👇
            </p>
          </motion.div>
        )}

        {/* Contact & Address Section */}
        {orderStatus !== 'Cancelled' && (
          <motion.div
            className="bg-white rounded-xl shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}>
            <SectionItem
              icon={PhoneIcon}
              title={`${order.address?.name || "Customer"}, ${order.address?.phone || "9XXXXXXXX"
                }`}
              subtitle="Delivery partner may call this number"
            />
            <SectionItem
              icon={HomeIcon}
              title="Delivery at Home"
              subtitle={
                order.address
                  ? `${order.address.address}, ${order.address.city}`
                  : "Add delivery address"
              }
            />
            {!['Partially Returned', 'Fully Returned', 'Return Under Review'].includes(orderStatus) && (
              <SectionItem
                icon={MessageSquareIcon}
                title="Add delivery instructions"
                subtitle=""
                onClick={() => setShowInstructionsModal(true)}
              />
            )}
          </motion.div>
        )}

        {/* Store Section */}
        <motion.div
          className="bg-white rounded-xl shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}>
          <div className="flex items-center gap-3 p-4 border-b border-dashed border-gray-200">
            <div className="w-12 h-12 rounded-full bg-orange-100 overflow-hidden flex items-center justify-center">
              <span className="text-2xl">🛒</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Inor fresh Store</p>
              <p className="text-sm text-gray-500">
                {order.address?.city || "Local Area"}
              </p>
            </div>
            <motion.button
              className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"
              whileTap={{ scale: 0.9 }}
              onClick={handleCallStore}>
              <PhoneIcon className="w-5 h-5 text-green-700" />
            </motion.button>
          </div>

          {/* Order Items */}
          <div
            className="p-4 border-b border-dashed border-gray-200"
            onClick={() => setShowItemsModal(true)}
            style={{ cursor: "pointer" }}>
            <div className="flex items-start gap-3">
              <ReceiptIcon className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  Order #{order.id.split("-").slice(-1)[0]}
                </p>
                <div className="mt-2 space-y-1">
                  {order.items?.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-4 h-4 rounded border border-green-600 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-green-600" />
                      </span>
                      <span>
                        {(parseWeight(item.variant || item.product?.pack || "", item.product?.productName || item.productName) * item.quantity).toFixed(1)} kg x{" "}
                        {item.product?.productName || item.productName || "Product"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {orderStatus !== 'Cancelled' && !['Partially Returned', 'Fully Returned', 'Return Under Review'].includes(orderStatus) && (
            <SectionItem
              icon={ChefHatIcon}
              title="Add special requests"
              subtitle=""
              onClick={() => setShowSpecialRequestsModal(true)}
            />
          )}
        </motion.div>

        {/* Help Section */}
        {orderStatus !== 'Cancelled' && !['Partially Returned', 'Fully Returned', 'Return Under Review'].includes(orderStatus) && (
          <motion.div
            className="bg-white rounded-xl shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}>
            <div
              className="flex items-center gap-3 p-4 border-b border-dashed border-gray-200"
              onClick={() => window.open('/help', '_blank')}
              style={{ cursor: "pointer" }}>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <HelpCircleIcon className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  Need help with your order?
                </p>
                <p className="text-sm text-gray-500">Get help & support</p>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </div>
            {(orderStatus as string) !== 'Cancelled' && (
              <SectionItem
                icon={CircleSlashIcon}
                title="Cancel order"
                subtitle=""
                onClick={() => setShowCancelModal(true)}
              />
            )}
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}>
          {!['Pending', 'Cancelled'].includes(orderStatus) ? (
            <Link to={`/invoice/${id}`} className="flex-1">
              <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
                View Invoice
              </Button>
            </Link>
          ) : (
            <div className="flex-1">
              <Button
                className="w-full bg-gray-400 cursor-not-allowed text-white"
                disabled
                title="Invoice will be available after order is confirmed">
                Invoice Unavailable
              </Button>
            </div>
          )}
          <Link to="/orders" className="flex-1">
            <Button variant="outline" className="w-full border-gray-300">
              All Orders
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Cancel Order Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowCancelModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Cancel Order
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to cancel this order? Please provide a
                reason:
              </p>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Enter cancellation reason..."
                value={cancellationReason}
                onChange={(e) => { setCancellationReason(e.target.value); setCancelError(''); }}
              />
              {cancelError && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                  {cancelError}
                </div>
              )}
              {cancelSuccess && (
                <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
                  {cancelSuccess}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setShowCancelModal(false); setCancelError(''); setCancelSuccess(''); }}>
                  Keep Order
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleCancelOrder}>
                  Cancel Order
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delivery Instructions Modal */}
      <AnimatePresence>
        {showInstructionsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowInstructionsModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Add Delivery Instructions
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Share details to help the delivery partner find you
              </p>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={4}
                maxLength={200}
                placeholder="e.g., Ring the bell, Leave at door, etc."
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
              />
              <p className="text-xs text-gray-500 mb-4">
                {deliveryInstructions.length}/200
              </p>
              {instructionsError && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                  {instructionsError}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setShowInstructionsModal(false); setInstructionsError(''); }}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSaveInstructions}>
                  Save
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Items Detail Modal */}
      <AnimatePresence>
        {showItemsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowItemsModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Order Items
              </h2>
              <div className="space-y-4">
                {order?.items?.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex gap-3 border-b border-gray-200 pb-4 last:border-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {item.product?.mainImage ? (
                        <img
                          src={item.product.mainImage}
                          alt={
                            item.product?.name || item.productName || "Product"
                          }
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.product?.name || item.productName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Weight: {(parseWeight(item.variant || item.product?.pack || "", item.product?.productName || item.productName) * item.quantity).toFixed(1)} kg
                      </p>
                      {item.variant && (
                        <p className="text-xs text-gray-500">{item.variant}</p>
                      )}
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        ₹
                        {item.total?.toFixed(0) ||
                          (item.unitPrice * item.quantity).toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setShowItemsModal(false)}>
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Special Requests Modal */}
      <AnimatePresence>
        {showSpecialRequestsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowSpecialRequestsModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Add Special Requests
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Let the store know if you have any special preferences
              </p>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={4}
                maxLength={200}
                placeholder="e.g., No onions, Extra napkins, etc."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
              <p className="text-xs text-gray-500 mb-4">
                {specialRequests.length}/200
              </p>
              {specialRequestsError && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                  {specialRequestsError}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setShowSpecialRequestsModal(false); setSpecialRequestsError(''); }}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSaveSpecialRequests}>
                  Save
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accept All Confirmation Modal */}
      <AnimatePresence>
        {showAcceptAllConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowAcceptAllConfirm(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✅</div>
              <h3 className="text-base font-bold text-neutral-800 mb-1">Accept All Items?</h3>
              <p className="text-sm text-neutral-500 mb-6">Are you sure you accept all items in this delivery with no returns?</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowAcceptAllConfirm(false)}>Cancel</Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleConfirmAcceptAll}>Yes, Accept All</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

