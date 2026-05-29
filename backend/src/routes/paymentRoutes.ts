import { Router } from 'express';
import { authenticate, requireUserType } from '../middleware/auth';
import { Request, Response } from 'express';
import { createRazorpayOrder, capturePayment, handleWebhook } from '../services/paymentService';
import Order from '../models/Order';
import { notifyWarehousesOfOrderUpdate } from '../services/warehouseNotificationService';
import { sendNotification } from '../services/notificationService';

const router = Router();

/**
 * Create Razorpay order for payment
 */
router.post('/create-order', authenticate, requireUserType('Customer', 'horeca', 'retailer'), async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required',
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Verify order belongs to customer
        if (order.customer.toString() !== req.user!.userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access to order',
            });
        }

        const result = await createRazorpayOrder(orderId, order.total);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error creating Razorpay order:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create payment order',
        });
    }
});

/**
 * Verify payment after Razorpay checkout
 */
router.post('/verify', authenticate, requireUserType('Customer', 'horeca', 'retailer'), async (req: Request, res: Response) => {
    try {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment verification parameters',
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Verify order belongs to customer
        if (order.customer.toString() !== req.user!.userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access to order',
            });
        }

        const result = await capturePayment(
            orderId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        // ── Post-payment notifications ──────────────────────────────────────
        // Fire-and-forget: errors here must never fail the payment response
        setImmediate(async () => {
            try {
                const updatedOrder = await Order.findById(orderId)
                    .populate({ path: 'items', populate: { path: 'warehouse' } })
                    .lean();

                if (!updatedOrder) {
                    console.error('❌ Updated order not found after payment verification:', orderId);
                    return;
                }

                const io = req.app.get('io');
                if (!io) {
                    console.error('❌ Socket.io instance not found on req.app!');
                    return;
                }

                // DEBUG: Log complete order structure for verification
                console.log('🔍 DEBUG: Order structure after payment verification:', {
                    orderId: updatedOrder._id,
                    orderNumber: (updatedOrder as any).orderNumber,
                    paymentStatus: (updatedOrder as any).paymentStatus,
                    itemsCount: (updatedOrder as any).items ? (updatedOrder as any).items.length : 0,
                    itemDetails: (updatedOrder as any).items?.map((item: any) => ({
                        itemId: item._id,
                        productName: item.productName,
                        warehouse: item.warehouse?._id || item.warehouse,
                        warehouseExists: !!item.warehouse
                    }))
                });

                // 1. Notify warehouses — this is their FIRST notification (order was held until payment confirmed)
                if (io && (updatedOrder as any).items && (updatedOrder as any).items.length > 0) {
                    console.log(`📦 About to notify warehouses for paid order: ${(updatedOrder as any).orderNumber}`);
                    await notifyWarehousesOfOrderUpdate(io, updatedOrder, 'NEW_ORDER');
                    console.log(`✅ Warehouses notified of new paid order ${(updatedOrder as any).orderNumber}`);
                } else {
                    console.warn('⚠️ Could not notify warehouses - order has no items or io unavailable:', {
                        itemsCount: (updatedOrder as any).items?.length,
                        ioAvailable: !!io
                    });
                }

                // 2. Notify admin about the newly paid order
                if (io) {
                    io.to('admin-notifications').emit('new-paid-order', {
                        orderId,
                        orderNumber: (updatedOrder as any).orderNumber,
                        total: (updatedOrder as any).total,
                        customerName: (updatedOrder as any).customerName,
                        paymentStatus: 'Paid',
                        timestamp: new Date(),
                    });
                }

                // 3. Send in-app notification to customer confirming payment
                const customerId = (updatedOrder as any).customer?.toString();
                if (customerId) {
                    await sendNotification(
                        'Customer',
                        customerId,
                        '✅ Payment Confirmed',
                        `Your payment for order #${(updatedOrder as any).orderNumber} has been received. Your order is now being processed.`,
                        {
                            type: 'Payment',
                            link: `/orders/${orderId}`,
                            priority: 'High',
                        }
                    );
                }
            } catch (notifyErr) {
                console.error('❌ Post-payment notification error (non-fatal):', notifyErr);
            }
        });
        // ────────────────────────────────────────────────────────────────────

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to verify payment',
        });
    }
});

/**
 * Razorpay webhook endpoint
 */
router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const signature = req.headers['x-razorpay-signature'] as string;

        if (!signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing webhook signature',
            });
        }

        const result = await handleWebhook(req.body, signature);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error handling webhook:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to handle webhook',
        });
    }
});

export default router;
