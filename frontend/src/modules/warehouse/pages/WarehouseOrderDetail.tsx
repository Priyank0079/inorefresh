import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getOrderById, updateOrderStatus, OrderDetail } from '../../../services/api/orderService';
// jsPDF is lazy-loaded inside handleExportPDF to avoid adding 384 kB to the initial bundle

export default function WarehouseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<string>('Out For Delivery');
  const [statusUpdateError, setStatusUpdateError] = useState('');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  // Fetch order detail from API
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) return;

      setLoading(true);
      setError('');
      try {
        const response = await getOrderById(id);
        if (response.success && response.data) {
          setOrderDetail(response.data);
          setOrderStatus(response.data.status);
        } else {
          setError(response.message || 'Failed to fetch order details');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!orderDetail) return;

    try {
      const response = await updateOrderStatus(orderDetail.id, { status: newStatus as any });
      if (response.success) {
        setOrderStatus(newStatus);
        setOrderDetail({ ...orderDetail, status: newStatus as any });
      } else {
        setStatusUpdateError('Failed to update order status');
        setTimeout(() => setStatusUpdateError(''), 3000);
      }
    } catch (err: any) {
      setStatusUpdateError(err.response?.data?.message || 'Failed to update order status');
      setTimeout(() => setStatusUpdateError(''), 3000);
    }
  };

  const handleConfirmReject = () => {
    setShowRejectConfirm(false);
    handleStatusUpdate('Rejected');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-neutral-500">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/warehouse/orders')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Order Not Found</h2>
          <button
            onClick={() => navigate('/warehouse/orders')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    return `${day}${suffix} ${month}, ${year}`;
  };

  const handleExportPDF = async () => {
    if (!orderDetail) return;

    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredHeight: number) => {
      if (yPos + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Header - Company Info
    doc.setFillColor(22, 163, 74); // Green color
    doc.rect(margin, yPos, contentWidth, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Inor fresh', margin + 5, yPos + 10);

    yPos += 20;

    // Company Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Inor fresh', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('From: Inor fresh', margin, yPos);
    yPos += 6;
    doc.text('Phone: 8956656429', margin, yPos);
    yPos += 6;
    doc.text('Email: info@Inor fresh.com', margin, yPos);
    yPos += 6;
    doc.text('Website: https://Inor fresh.com', margin, yPos);
    yPos += 12;

    // Invoice Details (Right aligned)
    const rightX = pageWidth - margin;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatDate(orderDetail.orderDate)}`, rightX, yPos - 30, { align: 'right' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice #${orderDetail.invoiceNumber}`, rightX, yPos - 20, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order ID: ${orderDetail.id}`, rightX, yPos - 14, { align: 'right' });
    doc.text(`Delivery Date: ${formatDate(orderDetail.deliveryDate)}`, rightX, yPos - 8, { align: 'right' });
    doc.text(`Time Slot: ${orderDetail.timeSlot}`, rightX, yPos - 2, { align: 'right' });

    // Status badge
    const statusWidth = doc.getTextWidth(orderStatus) + 8;
    doc.setFillColor(59, 130, 246); // Blue for status
    doc.roundedRect(rightX - statusWidth, yPos + 2, statusWidth, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(orderStatus, rightX - statusWidth / 2, yPos + 5.5, { align: 'center' });

    yPos += 15;
    doc.setTextColor(0, 0, 0);

    // Draw a line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Table Header
    checkPageBreak(20);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, contentWidth, 10, 'F');

    const colWidths = [
      contentWidth * 0.07,  // Sr. No.
      contentWidth * 0.32,  // Product
      contentWidth * 0.12,  // Unit
      contentWidth * 0.13,  // Price
      contentWidth * 0.14,  // Tax
      contentWidth * 0.09,  // Qty
      contentWidth * 0.13,  // Subtotal
    ];

    let xPos = margin;
    const headers = ['Sr. No.', 'Product', 'Unit', 'Price', 'Tax (Rs)(%)', 'Qty', 'Subtotal'];

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    headers.forEach((header, index) => {
      doc.text(header, xPos + 2, yPos + 7);
      xPos += colWidths[index];
    });

    yPos += 12;

    // Table Rows
    orderDetail.items.forEach((item) => {
      checkPageBreak(15);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      xPos = margin;
      const rowData = [
        item.srNo.toString(),
        item.product,
        formatUnit(item.unit, item.qty),
        `Rs.${item.price.toFixed(2)}`,
        `${item.tax.toFixed(2)} (${item.taxPercent.toFixed(2)}%)`,
        item.qty.toString(),
        `Rs.${item.subtotal.toFixed(2)}`,
      ];
      // Color alternating rows
      if (orderDetail.items.indexOf(item) % 2 === 1) {
        doc.setFillColor(249, 249, 249);
        doc.rect(margin, yPos - 1, contentWidth, 10, 'F');
      }

      rowData.forEach((data, index) => {
        // Truncate ALL columns to their max width to prevent overflow
        const maxWidth = colWidths[index] - 4;
        let text = data;
        if (doc.getTextWidth(text) > maxWidth) {
          while (doc.getTextWidth(text + '...') > maxWidth && text.length > 0) {
            text = text.slice(0, -1);
          }
          text += '...';
        }
        doc.text(text, xPos + 2, yPos + 5);
        xPos += colWidths[index];
      });

      // Draw row separator
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8);

      yPos += 10;
    });

    // Calculate totals
    const totalSubtotal = orderDetail.items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalTax = orderDetail.items.reduce((sum, item) => sum + item.tax, 0);
    const grandTotal = totalSubtotal + totalTax;

    yPos += 5;
    checkPageBreak(30);

    // Totals Section
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', pageWidth - margin - 55, yPos);
    doc.text(`Rs. ${totalSubtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;

    doc.text('Tax:', pageWidth - margin - 55, yPos);
    doc.text(`Rs. ${totalTax.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;

    // Grand Total background
    doc.setFillColor(240, 250, 248);
    doc.rect(margin, yPos - 4, contentWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Grand Total:', pageWidth - margin - 55, yPos + 3);
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, pageWidth - margin, yPos + 3, { align: 'right' });
    yPos += 15;

    // Footer
    checkPageBreak(20);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Bill Generated by Inor fresh', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(8);
    doc.text('Copyright © 2026. Developed By Inor fresh', pageWidth / 2, yPos, { align: 'center' });

    // Save the PDF
    const fileName = `Invoice_${orderDetail.invoiceNumber}_${orderDetail.id}.pdf`;
    doc.save(fileName);
  };

  const handlePrint = () => {
    if (!orderDetail) return;
    const printArea = document.getElementById('warehouse-print-invoice');
    if (!printArea) return;

    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;

    const totalSubtotal = orderDetail.items.reduce((s, i) => s + i.subtotal, 0);
    const totalTax = orderDetail.items.reduce((s, i) => s + i.tax, 0);
    const grandTotal = totalSubtotal + totalTax;

    w.document.write(`<!DOCTYPE html><html><head>
      <title>Invoice ${orderDetail.invoiceNumber}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Arial,sans-serif;padding:20px;color:#111;background:#fff;font-size:13px;}
        /* Header banner */
        .invoice-banner{background:#16a34a;color:#fff;padding:10px 16px;border-radius:4px 4px 0 0;font-size:18px;font-weight:700;margin-bottom:0;}
        .invoice-card{border:1px solid #e5e7eb;border-radius:4px;margin-bottom:16px;overflow:hidden;}
        .invoice-header{padding:16px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e5e7eb;}
        .company-info h2{font-size:18px;font-weight:700;color:#111;margin-bottom:4px;}
        .company-info p{font-size:12px;color:#4b5563;line-height:1.6;}
        .company-info a{color:#0d9488;text-decoration:none;}
        .invoice-meta{text-align:right;font-size:12px;color:#4b5563;}
        .invoice-meta .inv-num{font-size:15px;font-weight:700;color:#111;margin:4px 0;}
        .invoice-meta p{line-height:1.7;}
        .status-badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600;background:#3b82f6;color:#fff;margin-top:4px;}
        /* Table */
        .table-wrap{padding:0;overflow:auto;}
        table{width:100%;border-collapse:collapse;font-size:12px;}
        thead tr{background:#f3f4f6;}
        thead th{padding:8px 10px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#374151;border-bottom:2px solid #e5e7eb;white-space:nowrap;}
        tbody td{padding:8px 10px;color:#111;border-bottom:1px solid #f0f0f0;vertical-align:middle;}
        tbody tr:nth-child(even){background:#fafafa;}
        .td-num{color:#0d9488;font-size:11px;}
        /* Totals */
        .totals-section{padding:12px 16px;border-top:1px solid #e5e7eb;}
        .totals-row{display:flex;justify-content:flex-end;gap:40px;padding:3px 0;font-size:13px;color:#374151;}
        .totals-row.grand{font-weight:700;font-size:14px;color:#111;border-top:1px solid #e5e7eb;padding-top:8px;margin-top:4px;}
        .totals-label{min-width:80px;text-align:right;}
        .totals-value{min-width:90px;text-align:right;}
        /* Footer */
        .footer-note{text-align:center;font-size:11px;color:#9ca3af;padding:10px 0 4px;border-top:1px dashed #e5e7eb;margin-top:8px;}
        @media print{
          body{padding:8px;}
          .invoice-banner{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
          thead tr{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
          tbody tr:nth-child(even){-webkit-print-color-adjust:exact;print-color-adjust:exact;}
          .totals-row.grand{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
        }
      </style>
    </head><body>
      <div class="invoice-banner">Inor fresh</div>
      <div class="invoice-card">
        <div class="invoice-header">
          <div class="company-info">
            <h2>Inor fresh</h2>
            <p>From: Inor fresh</p>
            <p>Phone: 8956656429</p>
            <p>Email: <a>info@inorfresh.com</a></p>
            <p>Website: https://inorfresh.com</p>
          </div>
          <div class="invoice-meta">
            <p>Date: ${formatDate(orderDetail.orderDate)}</p>
            <div class="inv-num">Invoice #${orderDetail.invoiceNumber}</div>
            <p>Order ID: ${orderDetail.id}</p>
            <p>Delivery Date: ${formatDate(orderDetail.deliveryDate)}</p>
            <p>Time Slot: ${orderDetail.timeSlot ?? 'N/A'}</p>
            <span class="status-badge">${orderStatus}</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Product</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Tax (Rs)(%)</th>
                <th>Qty</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${orderDetail.items.map((item, idx) => `
              <tr>
                <td class="td-num">${item.srNo}</td>
                <td>${item.product}</td>
                <td>${formatUnit(item.unit, item.qty)}</td>
                <td>Rs. ${item.price.toFixed(2)}</td>
                <td>${item.tax.toFixed(2)} (${item.taxPercent.toFixed(2)}%)</td>
                <td>${item.qty}</td>
                <td><strong>Rs. ${item.subtotal.toFixed(2)}</strong></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="totals-section">
          <div class="totals-row">
            <span class="totals-label">Subtotal:</span>
            <span class="totals-value">Rs. ${totalSubtotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span class="totals-label">Tax:</span>
            <span class="totals-value">Rs. ${totalTax.toFixed(2)}</span>
          </div>
          <div class="totals-row grand">
            <span class="totals-label">Grand Total:</span>
            <span class="totals-value">Rs. ${grandTotal.toFixed(2)}</span>
          </div>
        </div>
        <div class="footer-note">Bill Generated by Inor fresh</div>
      </div>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-blue-100 text-blue-800 border border-blue-400';
      case 'On the way':
        return 'bg-purple-100 text-purple-800 border border-purple-400';
      case 'Delivered':
        return 'bg-teal-50 text-[#12b2a2] border border-green-400';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border border-red-400';
      case 'Out For Delivery':
        return 'bg-blue-600 text-white border border-blue-700';
      case 'Received':
        return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'Payment Pending':
        return 'bg-orange-50 text-orange-600 border border-orange-200';
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
  };

  const formatUnit = (unit: string, qty: number) => { // qty is kept for signature compatibility
    if (!unit || unit === 'N/A') return 'N/A';

    // Detect MongoDB ObjectId (24-char hex) — unit is an un-populated reference, show N/A
    if (/^[a-f0-9]{24}$/i.test(unit.trim())) return 'N/A';

    // Check if the unit is purely numeric (e.g. '200') or has letters (e.g. '200g')
    const match = unit.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)$/);
    if (match) {
      const val = parseFloat(match[1]);
      const u = match[2];

      if (!isNaN(val)) {
        const unitString = u ? (u.length > 2 && u.toLowerCase() !== 'pcs' ? ` ${u}` : u) : '';
        return `${parseFloat(val.toFixed(2))}${unitString}`;
      }
    }

    // Special case for fish if it somehow still says "fish"
    if (unit.toLowerCase().includes('fish')) {
      return `1kg`;
    }

    return unit;
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      {/* Order Action Section */}
      <div className="bg-white mb-6 rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
          <h2 className="text-base sm:text-lg font-semibold">Order Action Section</h2>
        </div>
        <div className="bg-neutral-50 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              {orderStatus === 'Received' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate('Accepted')}
                    className="flex-1 bg-[#12b2a2] hover:bg-[#0e7490] text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm"
                  >
                    Accept Order
                  </button>
                  <button
                    onClick={() => setShowRejectConfirm(true)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm"
                  >
                    Reject Order
                  </button>
                </div>
              ) : (
                <select
                  value={orderStatus}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  disabled={orderStatus === 'Rejected' || orderStatus === 'Cancelled' || orderStatus === 'Delivered'}
                >
                  <option value="Accepted">Accepted</option>
                  <option value="On the way">On the way</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  {orderStatus === 'Rejected' && <option value="Rejected">Rejected</option>}
                </select>
              )}
            </div>
            {statusUpdateError && (
              <div className="w-full sm:w-auto px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                {statusUpdateError}
              </div>
            )}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-[#12b2a2] hover:bg-[#0e7490] text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Export Invoice PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#12b2a2] hover:bg-[#0e7490] text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print Invoice
            </button>
          </div>
        </div>
      </div>

      {/* View Order Details Section */}
      <div id="warehouse-print-invoice" className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
          <h2 className="text-base sm:text-lg font-semibold">View Order Details</h2>
        </div>
        <div className="bg-white px-4 sm:px-6 py-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
            {/* Left: Company Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-[#12b2a2] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <div>
                  <div className="text-xs text-[#12b2a2] font-semibold">Inor fresh</div>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">Inor fresh</h1>
              <div className="text-sm text-neutral-600 mb-1">
                <span className="font-medium">From:</span> Inor fresh
              </div>
              <div className="text-sm text-neutral-600 space-y-1">
                <div>
                  <span className="font-medium">Phone:</span> 8956656429
                </div>
                <div>
                  <span className="font-medium">Email:</span> info@Inor fresh.com
                </div>
                <div>
                  <span className="font-medium">Website:</span> https://Inor fresh.com
                </div>
              </div>
            </div>

            {/* Right: Invoice Details */}
            <div className="flex-1 lg:text-right">
              <div className="text-sm text-neutral-600 mb-4">
                <span className="font-medium">Date:</span> {formatDate(orderDetail.orderDate)}
              </div>
              <div className="text-lg font-semibold text-neutral-900 mb-1">Invoice #{orderDetail.invoiceNumber}</div>
              <div className="text-sm text-neutral-600 mb-1">
                <span className="font-medium">Order ID:</span> {orderDetail.id}
              </div>
              <div className="text-sm text-neutral-600 mb-1">
                <span className="font-medium">Delivery Date:</span> {formatDate(orderDetail.deliveryDate)}
              </div>
              <div className="text-sm text-neutral-600 mb-3">
                <span className="font-medium">Time Slot:</span> {orderDetail.timeSlot}
              </div>
              <div className="flex items-center gap-2 lg:justify-end">
                <span className="text-sm font-medium text-neutral-700">Order Status:</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(orderStatus)}`}>
                  {orderStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Product Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full min-w-[800px]">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Sr. No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Tax (₹) (%)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {orderDetail.items.map((item) => (
                  <tr key={item.srNo}>
                    <td className="px-4 py-3 text-sm text-neutral-900">{item.srNo}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{item.product}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{formatUnit(item.unit, item.qty)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">₹{item.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {item.tax.toFixed(2)} ({item.taxPercent.toFixed(2)}%)
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{item.qty}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900 font-medium">₹{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bill Generation Note */}
          <div className="border-t border-dashed border-neutral-300 pt-4">
            <p className="text-sm text-neutral-600 text-center">
              Bill Generated by Inor fresh
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 px-4 sm:px-6 text-center py-4 bg-neutral-100 rounded-lg">
        <p className="text-xs sm:text-sm text-neutral-600">
          Copyright © 2026. Developed By{' '}
          <span className="font-semibold text-teal-600">Inor fresh</span>
        </p>
      </footer>

      {/* Reject Confirmation Modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRejectConfirm(false)} />
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10 text-center">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-neutral-800 mb-1">Reject Order?</h3>
            <p className="text-sm text-neutral-500 mb-6">Are you sure you want to reject this order? This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectConfirm(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Yes, Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


