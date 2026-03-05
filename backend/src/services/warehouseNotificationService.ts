import { Server as SocketIOServer } from 'socket.io';
import OrderItem from '../models/OrderItem';
import mongoose from 'mongoose';

/**
 * Notify all warehouses involved in an order about a new order or status change
 */
export async function notifywarehousesOfOrderUpdate(
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

        const warehouseIds = [...new Set(orderItems.map((item: any) => item.warehouse.toString()))];

        console.log(`🔔 Notifying ${warehouseIds.length} warehouses about ${type} for order ${order.orderNumber}`);

        for (const warehouseId of warehouseIds) {
            // Get only items belonging to this warehouse
            const warehouseSpecificItems = orderItems.filter((item: any) => item.warehouse.toString() === warehouseId);

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
            io.to(`warehouse-${warehouseId}`).emit('warehouse-notification', notificationData);
            console.log(`📤 Emitted notification to warehouse-${warehouseId}`);
        }
    } catch (error) {
        console.error('Error in notifywarehousesOfOrderUpdate:', error);
    }
}
