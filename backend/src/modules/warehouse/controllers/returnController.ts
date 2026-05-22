import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Return from "../../../models/Return";
import OrderItem from "../../../models/OrderItem";
import { sendNotification } from "../../../services/notificationService";
import { getIO } from "../../../socket/socketService";

export const getReturnRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const WarehouseId = req.user?.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const query: any = {};
    if (status && status !== 'All Status') {
      query.status = status;
    }

    // Find return requests where the associated OrderItem belongs to this Warehouse
    // 1. Find OrderItems for this Warehouse
    const WarehouseOrderItems = await OrderItem.find({ warehouse: WarehouseId }).select('_id');
    const WarehouseOrderItemIds = WarehouseOrderItems.map(item => item._id);

    // 2. Filter Returns by these OrderItem IDs
    query.orderItem = { $in: WarehouseOrderItemIds };

    const returns = await Return.find(query)
      .populate({
        path: 'orderItem',
        select: 'productName productImage quantity unitPrice total sku variation variantTitle'
      })
      .populate({
        path: 'order',
        select: 'orderNumber customerName'
      })
      .populate('customer', 'name email mobile')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Return.countDocuments(query);

    // Map to frontend friendly format
    const formattedReturns = returns.map(ret => {
      const item = ret.orderItem as any;
      const order = ret.order as any;
      return {
        id: ret._id,
        orderItemId: item?._id?.toString().slice(-6) || 'N/A', // Short ID for UI
        productName: item?.productName || 'Unknown Product',
        shopName: order?.customerName || 'N/A',
        customerName: order?.customerName || 'Unknown Customer',
        orderId: order?.orderNumber || 'Unknown Order',
        price: item?.unitPrice || 0,
        discPrice: 0, // Disc price logic if available
        quantity: ret.quantity,
        amount: item?.total || 0,
        status: ret.status,
        date: ret.createdAt.toISOString().split('T')[0],
        returnReason: ret.reason,
        description: ret.description,
        images: ret.images || [],
        image: item?.productImage,
        variant: item?.variantTitle || item?.variation || '',
        total: (item?.unitPrice || 0) * ret.quantity,
        product: item?.productName || 'Unknown Product',
        proofOfPickupEvidence: ret.proofOfPickupEvidence || [],
        riderRemarks: ret.riderRemarks || "",
        warehouseVerificationOtp: ret.warehouseVerificationOtp || null,
        warehouseVerificationOtpVerified: ret.warehouseVerificationOtpVerified || false,
        reverseLogisticsCode: ret.reverseLogisticsCode || null,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedReturns,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  }
);

export const getReturnRequestById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const returnRequest = await Return.findById(id)
      .populate({
        path: 'orderItem',
        select: 'productName productImage quantity unitPrice total sku variation variantTitle'
      })
      .populate({
        path: 'order',
        select: 'orderNumber customerName deliveryAddress paymentMethod'
      })
      .populate('customer', 'name email mobile');

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found"
      });
    }

    const item = returnRequest.orderItem as any;
    const order = returnRequest.order as any;

    const formattedDetail = {
      id: returnRequest._id,
      orderId: order?.orderNumber,
      orderDate: order?.createdAt, // Or orderDate if available
      status: returnRequest.status,
      customerName: order?.customerName,
      customerEmail: (returnRequest.customer as any)?.email,
      customerPhone: (returnRequest.customer as any)?.mobile,
      shippingAddress: order?.deliveryAddress ? `${order.deliveryAddress.address}, ${order.deliveryAddress.city}, ${order.deliveryAddress.pincode}` : 'N/A',
      paymentMethod: order?.paymentMethod,
      items: [
        {
          id: item?._id,
          name: item?.productName,
          sku: item?.sku || 'N/A',
          price: item?.unitPrice || 0,
          quantity: returnRequest.quantity, // Return quantity might differ from order item quantity? Using return quantity.
          total: (item?.unitPrice || 0) * returnRequest.quantity,
          image: item?.productImage,
          variant: item?.variantTitle || item?.variation || ''
        }
      ],
      subtotal: (item?.unitPrice || 0) * returnRequest.quantity,
      tax: 0, // Mock for now
      total: (item?.unitPrice || 0) * returnRequest.quantity,
      reason: returnRequest.reason,
      reasonDescription: returnRequest.description,
      proofOfPickupEvidence: returnRequest.proofOfPickupEvidence || [],
      riderRemarks: returnRequest.riderRemarks || "",
    };


    return res.status(200).json({
      success: true,
      data: formattedDetail,
    });
  }
);

export const updateReturnStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const returnRequest = await Return.findById(id).populate("order");
    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found"
      });
    }

    const order = returnRequest.order as any;

    if (status === 'Approved') {
      returnRequest.status = 'Approved';
      returnRequest.wholesalerStatus = 'Approved';
      returnRequest.reverseLogisticsCode = `RET-${Date.now()}`;
      returnRequest.warehouseVerificationOtp = Math.floor(1000 + Math.random() * 9000).toString();
      
      if (order && order.status === 'Return Under Review') {
        order.status = 'Partially Returned';
        await order.save();
      }
    } else if (status === 'Rejected') {
      returnRequest.status = 'Rejected';
      returnRequest.wholesalerStatus = 'Rejected';
      returnRequest.rejectionReason = req.body.rejectionReason || req.body.adminNotes || 'Rejected by Wholesaler';

      if (order && (order.status === 'Return Under Review' || order.status === 'Fully Returned')) {
        order.status = 'Delivered';
        await order.save();
      }
    } else {
      returnRequest.status = status;
    }

    await returnRequest.save();

    // Notify Rider and Customer
    if (order) {
      if (returnRequest.deliveryBoy) {
        try {
          await sendNotification(
            "Delivery",
            returnRequest.deliveryBoy.toString(),
            "Return Request Update",
            `Return request for Order #${order.orderNumber} has been ${status}d.`,
            { type: "Order", priority: "High" }
          );
        } catch (err) {
          console.error("Failed to send notification to rider:", err);
        }

        try {
          const io = getIO();
          io.to(`delivery-${returnRequest.deliveryBoy.toString()}`).emit("delivery-update", {
            orderId: order._id,
            status: order.status,
            isVerifiedByCustomer: order.isVerifiedByCustomer,
            riderStatusDuringInspection: "IDLE"
          });
        } catch (err) {
          console.error("Failed to emit socket to rider:", err);
        }
      }

      try {
        const io = getIO();
        io.to(`customer-${order.customer.toString()}`).emit("order-update", {
          orderId: order._id,
          status: order.status,
          isVerifiedByCustomer: order.isVerifiedByCustomer
        });
      } catch (err) {
        console.error("Failed to emit socket to customer:", err);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Return status updated to ${status} successfully`,
      data: returnRequest
    });
  }
);
