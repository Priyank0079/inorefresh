import { Server as SocketIOServer } from 'socket.io';
import OrderItem from '../models/OrderItem';
import mongoose from 'mongoose';
import { sendNotification } from './notificationService';
import Admin from '../models/Admin';

/**
 * Notify all warehouses involved in an order about a new order or status change
 */
export async function notifyWarehousesOfOrderUpdate(
    io: SocketIOServer,
    order: any,
    type: 'NEW_ORDER' | 'STATUS_UPDATE' | 'ORDER_CANCELLED'
): Promise<void> {
    try {
        if (!io) {
            console.error('Socket.io server not provided to notifywarehousesOfOrderUpdate');
            return;
        }

        // Get all unique warehouse IDs from order items
        // If items are populated, we can get them directly, otherwise we need to query
        let orderItems = order.items;

        // If items are just IDs, fetch the full OrderItem details to get warehouse IDs
        if (orderItems.length > 0 && typeof orderItems[0] === 'string' || orderItems[0] instanceof mongoose.Types.ObjectId) {
            orderItems = await OrderItem.find({ order: order._id });
        }

        const rawIds = orderItems.map((item: any) => {
            const wId = item.warehouse?._id || item.warehouse;
            return wId ? wId.toString() : (null as any);
        }).filter((id: any): id is string => !!id);

        const warehouseIds: string[] = Array.from(new Set(rawIds)) as string[];

        console.log(`🔔 Notifying ${warehouseIds.length} warehouses about ${type} for order ${order.orderNumber}:`, {
            warehouseIds,
            orderNumber: order.orderNumber,
            orderId: order._id?.toString(),
            itemsCount: orderItems.length,
            ioConnected: !!io,
            itemWithWarehouses: orderItems.map((item: any) => ({
                productName: item.productName,
                warehouse: item.warehouse?._id || item.warehouse
            }))
        });

        if (warehouseIds.length === 0) {
            console.warn('⚠️ WARNING: No warehouses found for order items! Order items may not be properly populated.');
            return;
        }

        for (const warehouseId of warehouseIds) {
            // Get only items belonging to this warehouse
            const warehouseSpecificItems = orderItems.filter((item: any) => {
                const wId = item.warehouse?._id || item.warehouse;
                return wId && wId.toString() === warehouseId;
            });

            const notificationData = {
                type,
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                paymentStatus: order.paymentStatus,
                customer: {
                    name: order.customerName,
                    email: order.customerEmail,
                    phone: order.customerPhone,
                    address: order.deliveryAddress
                },
                items: warehouseSpecificItems.map((item: any) => ({
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.unitPrice,
                    total: item.total,
                    variation: item.variation
                })),
                totalAmount: warehouseSpecificItems.reduce((acc: number, item: any) => acc + item.total, 0),
                timestamp: new Date()
            };

            // Emit to warehouse-specific room
            const roomName = `warehouse-${warehouseId}`;
            console.log(`📤 About to emit warehouse-notification to room: ${roomName}`);
            io.to(roomName).emit('warehouse-notification', notificationData);
            console.log(`✅ Emitted socket notification to room: ${roomName}`);

            // Also send push notification
            try {
                const { sendNotificationToUser } = await import('./firebaseAdmin');
                await sendNotificationToUser(
                    warehouseId,
                    'Warehouse',
                    {
                        title: type === 'NEW_ORDER' ? '🔔 New Order Received!' : 
                               type === 'ORDER_CANCELLED' ? '❌ Order Cancelled' : '📦 Order Updated',
                        body: type === 'NEW_ORDER' ? `Order #${order.orderNumber} from ${order.customerName}` :
                               type === 'ORDER_CANCELLED' ? `Order #${order.orderNumber} has been cancelled by customer` :
                               `Order #${order.orderNumber} status updated to ${order.status}`,
                        data: {
                            type: 'order',
                            orderId: order._id.toString(),
                            orderNumber: order.orderNumber
                        }
                    }
                );
                console.log(`📲 Sent push notification to warehouse-${warehouseId}`);
            } catch (pushError) {
                console.error('Failed to send push notification to warehouse:', pushError);
            }
        }

        // ── Notify all admins when a brand-new order arrives ─────────────────
        // Admins should always see new orders in their dashboard in real-time.
        if (type === 'NEW_ORDER') {
            try {
                // Real-time socket to the admin-notifications room (covers all logged-in admins)
                io.to('admin-notifications').emit('new-order-admin', {
                    type: 'NEW_ORDER',
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    customerName: order.customerName,
                    total: order.total,
                    paymentMethod: order.paymentMethod,
                    paymentStatus: order.paymentStatus,
                    status: order.status,
                    timestamp: new Date(),
                });

                // Also send a persisted notification to every admin so they see it in the bell icon
                const admins = await Admin.find({ isActive: { $ne: false } }).select('_id').lean();
                await Promise.allSettled(
                    admins.map((admin: any) =>
                        sendNotification(
                            'Admin',
                            admin._id.toString(),
                            '🛒 New Order Received',
                            `Order #${order.orderNumber} from ${order.customerName} — ₹${order.total}`,
                            {
                                type: 'Order',
                                link: `/admin/orders/${order._id}`,
                                priority: 'High',
                            }
                        ).catch(() => { /* non-critical */ })
                    )
                );

                console.log(`👑 Admin notified of new order ${order.orderNumber}`);
            } catch (adminNotifyError) {
                console.error('Failed to notify admin of new order:', adminNotifyError);
            }
        }
        // ────────────────────────────────────────────────────────────────────
    } catch (error) {
        console.error('Error in notifyWarehousesOfOrderUpdate:', error);
    }
}
