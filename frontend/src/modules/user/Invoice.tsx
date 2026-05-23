import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
// html2canvas (201 kB) and jsPDF (384 kB) are lazy-loaded only when the user clicks Download
import Button from "../../components/ui/button";
import { useOrders } from "../../hooks/useOrders";

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

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const PrinterIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

export default function Invoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById, fetchOrderById } = useOrders();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;

      const existingOrder = getOrderById(id);
      if (existingOrder) {
        setOrder(existingOrder);
        setLoading(false);
        return;
      }

      setLoading(true);
      const fetchedOrder = await fetchOrderById(id);
      if (fetchedOrder) {
        setOrder(fetchedOrder);
      }
      setLoading(false);
    };

    loadOrder();
  }, [id, getOrderById, fetchOrderById]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const element = document.getElementById("invoice-content");
    if (!element) return;

    try {
      setIsGenerating(true);
      // Lazy-load heavy PDF libs only on first download click
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${order.id?.split("-").slice(-1)[0] || id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="text-sm text-neutral-500">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto text-center py-20">
          <h1 className="text-xl font-bold mb-4">Invoice Not Found</h1>
          <Link to="/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = order.subtotal || 0;
  const deliveryFee = order.fees?.deliveryFee || 0;
  const platformFee = order.fees?.platformFee || 0;
  const totalAmount = order.totalAmount || subtotal + deliveryFee + platformFee;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with actions - hidden when printing */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors font-medium text-sm">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex gap-6 items-center">
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className={`flex items-center gap-2 transition-colors font-medium text-sm ${
                isGenerating ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-900'
              }`}>
              <DownloadIcon className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Download'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors font-medium text-sm">
              <PrinterIcon className="w-4 h-4" />
              <span>Print</span>
            </button>
            <Link 
              to={`/orders/${id}`}
              className="text-teal-600 hover:text-teal-700 font-bold text-sm tracking-tight"
            >
              Order Details
            </Link>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 print:py-4">
        <motion.div
          id="invoice-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm print:shadow-none p-8 print:p-6">
          {/* Invoice Header */}
          <div className="border-b-2 border-gray-100 pb-8 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-1">
                  Inor Fresh
                </h1>
                <p className="text-gray-500 font-medium">Invoice</p>
              </div>
              
              <div className="space-y-2 text-left md:text-right">
                <div className="flex md:justify-end items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">No:</span>
                  <span className="text-sm font-bold text-gray-900 break-all max-w-[200px] md:max-w-none">
                    #{order.id?.split("-").slice(-1)[0] || order.id || "N/A"}
                  </span>
                </div>
                <div className="flex md:justify-end items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date:</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {order.createdAt ? formatDate(order.createdAt) : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div className="space-y-4">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Billing Address</h2>
              <div className="text-sm text-gray-600 leading-relaxed">
                <p className="font-bold text-gray-900 text-base mb-1">{order.address?.name || "Customer"}</p>
                <p>{order.address?.phone || ""}</p>
                <p className="mt-2">
                  {order.address?.flat && `${order.address.flat}, `}
                  {order.address?.street || order.address?.address || ""}
                </p>
                <p>
                  {order.address?.city || ""}{order.address?.pincode && ` - ${order.address.pincode}`}
                </p>
              </div>
            </div>
            
            <div className="space-y-4 md:text-right">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Order Details</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium text-gray-400">Payment:</span> <span className="text-gray-900 font-semibold">{order.paymentMethod || 'N/A'}</span></p>
                <p><span className="font-medium text-gray-400">Status:</span> <span className="text-green-600 font-bold">{order.status || "Confirmed"}</span></p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-12">
            <table className="w-full text-left">
              <thead className="border-b-2 border-gray-50">
                <tr>
                  <th className="py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Item Description</th>
                  <th className="py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">Qty</th>
                  <th className="py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest">Price</th>
                  <th className="py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items?.map((item: any, index: number) => {
                  const productName = item.product?.name || item.productName || "Product";
                  const unitPrice = item.product?.price || item.unitPrice || item.price || 0;
                  const quantity = item.quantity || 1;
                  const itemTotal = item.total || unitPrice * quantity;

                  return (
                    <tr key={index}>
                      <td className="py-5">
                        <p className="font-bold text-gray-900">{productName}</p>
                        {item.variant && <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>}
                      </td>
                      <td className="py-5 text-center text-gray-600 font-medium">{quantity}</td>
                      <td className="py-5 text-right text-gray-600 font-medium">{formatCurrency(unitPrice)}</td>
                      <td className="py-5 text-right font-bold text-gray-900">{formatCurrency(itemTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-8 border-t-2 border-gray-50">
            <div className="w-full md:w-64 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-400 uppercase tracking-wider">Subtotal</span>
                <span className="font-bold text-gray-700">{formatCurrency(subtotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-400 uppercase tracking-wider">Delivery</span>
                  <span className="font-bold text-gray-700">{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100">
                <span className="text-base font-bold text-gray-900 uppercase tracking-widest">Total</span>
                <span className="text-2xl font-bold text-teal-600">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Simple Footer */}
          <div className="mt-20 text-center">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em] mb-2">Thank you for shopping with Inor Fresh</p>
            <div className="h-1 w-12 bg-gray-100 mx-auto rounded-full"></div>
          </div>
        </motion.div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

