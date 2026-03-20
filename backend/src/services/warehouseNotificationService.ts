import { Server as SocketIOServer } from 'socket.io';
import OrderItem from '../models/OrderItem';
import mongoose from 'mongoose';

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

        console.log(`🔔 Notifying ${warehouseIds.length} warehouses about ${type} for order ${order.orderNumber}:`, warehouseIds);

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
            io.to(roomName).emit('warehouse-notification', notificationData);
            console.log(`📤 Emitted socket notification to room: ${roomName}`);

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
    } catch (error) {
        console.error('Error in notifyWarehousesOfOrderUpdate:', error);
    }
}
