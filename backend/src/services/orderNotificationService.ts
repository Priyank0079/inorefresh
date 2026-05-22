import { Server as SocketIOServer } from 'socket.io';
import Delivery from '../models/Delivery';
import Order from '../models/Order';
import Warehouse from '../models/Warehouse';
import DeliveryTracking from '../models/DeliveryTracking';
import AppSettings from '../models/AppSettings';
import mongoose from 'mongoose';
import { notifyWarehousesOfOrderUpdate } from './warehouseNotificationService';

/**
 * Calculate estimated delivery boy earning for a new order
 * Uses the same logic as commission distribution but provides an estimate
 * before the order is assigned
 */
async function calculateEstimatedDeliveryBoyEarning(order: any): Promise<number> {
    try {
        // @ts-ignore - getSettings is a static method
        const settings = await AppSettings.getSettings();

        // Check if distance-based delivery is enabled
        if (
            settings?.deliveryConfig?.isDistanceBased === true &&
            settings.deliveryConfig?.deliveryBoyKmRate &&
            order.deliveryDistanceKm &&
            order.deliveryDistanceKm > 0
        ) {
            // Distance-based calculation
            const earning = order.deliveryDistanceKm * settings.deliveryConfig.deliveryBoyKmRate;
            console.log(`📊 [Earning Calc] Distance-based: ${order.deliveryDistanceKm}km × ₹${settings.deliveryConfig.deliveryBoyKmRate}/km = ₹${earning.toFixed(2)}`);
            return Math.round(earning * 100) / 100;
        }

        // Fallback to percentage-based on subtotal (default 5%)
        // Since we don't know which delivery boy will accept, use default rate
        const defaultCommissionRate = 5;
        const earning = (order.subtotal * defaultCommissionRate) / 100;
        console.log(`📊 [Earning Calc] Percentage-based: ${order.subtotal} × ${defaultCommissionRate}% = ₹${earning.toFixed(2)}`);
        return Math.round(earning * 100) / 100;
    } catch (error) {
        console.error('Error calculating estimated delivery boy earning:', error);
        // Return a safe default - 5% of subtotal
        return Math.round((order.subtotal * 5) / 100 * 100) / 100;
    }
}

// Track order notification state
export interface OrderNotificationState {
    orderId: string;
    notifiedDeliveryBoys: Set<string>;
    rejectedDeliveryBoys: Set<string>;
    acceptedBy: string | null;
    notificationTime?: Date;
}

export const notificationStates = new Map<string, OrderNotificationState>();

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Find all available delivery boys (online and active)
 */
export async function findAvailableDeliveryBoys(): Promise<mongoose.Types.ObjectId[]> {
    try {
        const deliveryBoys = await Delivery.find({
            isOnline: true,
            status: 'Active',
        }).select('_id');

        return deliveryBoys.map(db => db._id);
    } catch (error) {
        console.error('Error finding available delivery boys:', error);
        return [];
    }
}

/**
 * Find delivery boys near a specific location within a radius
 * Uses the delivery boy's location from the Delivery model (preferred)
 * or falls back to DeliveryTracking
 */
export async function findDeliveryBoysNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
): Promise<{ deliveryBoyId: mongoose.Types.ObjectId; distance: number }[]> {
    try {
        // 1. Try to find delivery boys using the new GeoJSON location field in Delivery model
        const nearbyDeliveryBoys: { deliveryBoyId: mongoose.Types.ObjectId; distance: number }[] = [];

        const deliveryBoysWithLocation = await Delivery.find({
            isOnline: true,
            status: 'Active',
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: radiusKm * 1000 // Convert km to meters
                }
            }
        }).select('_id location');

        if (deliveryBoysWithLocation.length > 0) {
            for (const db of deliveryBoysWithLocation) {
                if (db.location && db.location.coordinates) {
                    const [dbLng, dbLat] = db.location.coordinates;
                    const distance = calculateDistance(latitude, longitude, dbLat, dbLng);
                    nearbyDeliveryBoys.push({
                        deliveryBoyId: db._id as mongoose.Types.ObjectId,
                        distance
                    });
                }
            }

            console.log(`📍 Found ${nearbyDeliveryBoys.length} delivery boys using live location within ${radiusKm}km of warehouse`);
            return nearbyDeliveryBoys.sort((a, b) => a.distance - b.distance);
        }

        console.log(`⚠️ No delivery boys found within ${radiusKm}km using live location. Checking fallback...`);

        // 2. Fallback to the old method using DeliveryTracking if no delivery boys found with the new field
        // Get all active and online delivery boys
        const allDeliveryBoys = await Delivery.find({
            isOnline: true,
            status: 'Active',
        }).select('_id');

        if (allDeliveryBoys.length === 0) {
            return [];
        }

        // Get latest locations for these delivery boys from DeliveryTracking
        const deliveryBoyIds = allDeliveryBoys.map(db => db._id);

        // Get the most recent tracking record for each delivery boy
        const trackingRecords = await DeliveryTracking.aggregate([
            {
                $match: {
                    deliveryBoy: { $in: deliveryBoyIds },
                    // Check both legacy fields and new currentLocation structure
                    $or: [
                        { 'currentLocation.latitude': { $exists: true }, 'currentLocation.longitude': { $exists: true } },
                        { latitude: { $exists: true }, longitude: { $exists: true } }
                    ]
                }
            },
            {
                $sort: { 'currentLocation.timestamp': -1, updatedAt: -1 }
            },
            {
                $group: {
                    _id: '$deliveryBoy',
                    latestLocation: { $first: '$currentLocation' },
                    legacyLat: { $first: '$latitude' },
                    legacyLng: { $first: '$longitude' }
                }
            }
        ]);

        for (const record of trackingRecords) {
            const deliveryLat = record.latestLocation?.latitude || record.legacyLat;
            const deliveryLng = record.latestLocation?.longitude || record.legacyLng;

            if (deliveryLat && deliveryLng) {
                const distance = calculateDistance(latitude, longitude, deliveryLat, deliveryLng);

                if (distance <= radiusKm) {
                    nearbyDeliveryBoys.push({
                        deliveryBoyId: record._id,
                        distance,
                    });
                }
            }
        }

        // Also include delivery boys who don't have tracking data yet (they might be new)
        // but give them a default distance
        const trackedIds = new Set(trackingRecords.map(r => r._id.toString()));
        for (const db of allDeliveryBoys) {
            if (!trackedIds.has(db._id.toString())) {
                // Include untracked delivery boys with a default distance
                nearbyDeliveryBoys.push({
                    deliveryBoyId: db._id as mongoose.Types.ObjectId,
                    distance: radiusKm / 2, // Default to half the radius
                });
            }
        }

        // Sort by distance (nearest first)
        nearbyDeliveryBoys.sort((a, b) => a.distance - b.distance);

        console.log(`📍 Found ${nearbyDeliveryBoys.length} delivery boys (fallback) within ${radiusKm}km`);
        return nearbyDeliveryBoys;
    } catch (error) {
        console.error('Error finding nearby delivery boys:', error);
        return [];
    }
}

/**
 * Find delivery boys near warehouse locations for an order
 * Aggregates all unique warehouses from order items and finds delivery boys within their service radius
 */
export async function findDeliveryBoysNearwarehouseLocations(
    order: any
): Promise<mongoose.Types.ObjectId[]> {
    try {
        // Get unique warehouse IDs from order items
        const warehouseIds = [...new Set(
            order.items
                ?.map((item: any) => {
                    const wh = item.warehouse;
                    if (!wh) return null;
                    if (typeof wh === 'object' && wh._id) return wh._id.toString();
                    return wh.toString();
                })
                .filter((id: string | null) => id) || []
        )] as string[];

        if (warehouseIds.length === 0) {
            console.log('No warehouses found in order, falling back to all available delivery boys');
            return findAvailableDeliveryBoys();
        }

        // Get warehouse locations
        const warehouses = await Warehouse.find({
            _id: { $in: warehouseIds },
        }).select('location serviceRadiusKm warehouseName');

        if (warehouses.length === 0) {
            console.log('No warehouse data found, falling back to all available delivery boys');
            return findAvailableDeliveryBoys();
        }

        // Find delivery boys near each warehouse location
        const nearbyDeliveryBoyMap = new Map<string, { distance: number }>();

        for (const warehouse of warehouses) {
            let lat: number | null = null;
            let lng: number | null = null;

            if (warehouse.location && warehouse.location.coordinates) {
                lng = warehouse.location.coordinates[0];
                lat = warehouse.location.coordinates[1];
            }

            if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                console.log(`warehouse ${warehouse.warehouseName} has no valid location, skipping`);
                continue;
            }

            const radius = warehouse.serviceRadiusKm || 10; // Default 10km
            const nearbyBoys = await findDeliveryBoysNearLocation(lat, lng, radius);

            for (const boy of nearbyBoys) {
                const boyId = boy.deliveryBoyId.toString();
                // Keep the smallest distance if same delivery boy is near multiple warehouses
                if (!nearbyDeliveryBoyMap.has(boyId) || nearbyDeliveryBoyMap.get(boyId)!.distance > boy.distance) {
                    nearbyDeliveryBoyMap.set(boyId, { distance: boy.distance });
                }
            }
        }

        if (nearbyDeliveryBoyMap.size === 0) {
            console.log('No delivery boys found near warehouse locations, falling back to all available');
            return findAvailableDeliveryBoys();
        }

        // Sort by distance and return IDs
        const sortedBoys = Array.from(nearbyDeliveryBoyMap.entries())
            .sort((a, b) => a[1].distance - b[1].distance)
            .map(([id]) => new mongoose.Types.ObjectId(id));

        console.log(`📍 Found ${sortedBoys.length} delivery boys near warehouse locations`);
        return sortedBoys;
    } catch (error) {
        console.error('Error finding delivery boys near warehouse locations:', error);
        return findAvailableDeliveryBoys();
    }
}

/**
 * Emit new order notification to delivery boys near warehouse locations
 * Prioritizes delivery boys within the warehouse's service radius.
 * Always broadcasts to the general 'delivery-notifications' room so
 * any connected delivery boy can receive the order even if they are not
 * in the targeted "nearby" list (e.g., newly joined or location not yet synced).
 */
export async function notifyDeliveryBoysOfNewOrder(
    io: SocketIOServer,
    orderOrId: any
): Promise<void> {
    try {
        let order = orderOrId;

        // Fetch full order if only ID is provided
        if (typeof orderOrId === 'string' || mongoose.isValidObjectId(orderOrId)) {
            console.log(`📦 Fetching full order details for notification trigger: ${orderOrId}`);
            order = await Order.findById(orderOrId)
                .populate({ path: 'items', populate: { path: 'warehouse' } });
        }

        if (!order || !order.items) {
            console.error(`❌ Order or order items not found for notification: ${orderOrId}`);
            return;
        }

        const orderId = order._id.toString();

        // Pre-compute order data early so we can broadcast even if no targeted list is found
        const deliveryBoyEarning = await calculateEstimatedDeliveryBoyEarning(order);
        const orderData = {
            orderId,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            deliveryAddress: {
                address: order.deliveryAddress.address,
                city: order.deliveryAddress.city,
                state: order.deliveryAddress.state,
                pincode: order.deliveryAddress.pincode,
            },
            total: order.total,
            subtotal: order.subtotal,
            shipping: order.shipping,
            deliveryBoyEarning,
            createdAt: order.createdAt,
        };

        // Find delivery boys near warehouse locations (within service radius)
        let nearbyDeliveryBoyIds = await findDeliveryBoysNearwarehouseLocations(order);

        // --- FILTER BUSY DELIVERY BOYS ---
        if (nearbyDeliveryBoyIds.length > 0) {
            const busyDeliveryBoys = await Order.find({
                deliveryBoy: { $in: nearbyDeliveryBoyIds },
                deliveryBoyStatus: { $in: ['Assigned', 'Picked Up', 'In Transit'] },
                status: { $nin: ['Delivered', 'Cancelled', 'Rejected', 'Returned'] }
            }).distinct('deliveryBoy');

            if (busyDeliveryBoys.length > 0) {
                const busyIdsSet = new Set(busyDeliveryBoys.map((id: any) => id.toString()));
                const originalCount = nearbyDeliveryBoyIds.length;
                nearbyDeliveryBoyIds = nearbyDeliveryBoyIds.filter(id => !busyIdsSet.has(id.toString()));
                console.log(`ℹ️ Filtered out ${originalCount - nearbyDeliveryBoyIds.length} busy delivery boys. Active: ${nearbyDeliveryBoyIds.length}`);
            }
        }
        // ---------------------------------

        // Emit to individual rooms for specifically targeted delivery boys
        const notifiedIds = new Set<string>();
        for (const item of nearbyDeliveryBoyIds) {
            const id = (item as any).deliveryBoyId || item;
            const idString = id.toString().trim();
            const roomName = `delivery-${idString}`;
            const room = io.sockets.adapter.rooms.get(roomName);

            if (room && room.size > 0) {
                notifiedIds.add(idString);
                io.to(roomName).emit('new-order', orderData);
                console.log(`📤 Emitted new-order to connected delivery boy room: ${roomName}`);
            } else {
                console.log(`⏩ Delivery boy ${idString} not connected to individual room; covered by broadcast`);
            }
        }

        // ALWAYS broadcast to the general room — this is the primary delivery mechanism.
        // It ensures any connected delivery boy receives the notification regardless of
        // whether their 'isOnline' flag is set in DB or they are in the targeted list.
        io.to('delivery-notifications').emit('new-order', orderData);
        console.log(`📡 Broadcasted new-order to all connected delivery boys (General Room)`);

        // Always create notification state so any delivery boy (targeted or broadcast) can respond
        notificationStates.set(orderId, {
            orderId,
            notifiedDeliveryBoys: notifiedIds,
            notificationTime: new Date(),
            rejectedDeliveryBoys: new Set<string>(),
            acceptedBy: null,
        });
        console.log(`✅ Notification state initialized for order ${orderId} (Individually targeted: ${notifiedIds.size}, broadcast: all connected)`);

        // Send Firebase push notifications to all nearby delivery boys as a background fallback
        // (covers the case where the app is not open / socket is not connected)
        if (nearbyDeliveryBoyIds.length > 0) {
            try {
                const { sendNotificationToUser } = await import('./firebaseAdmin');
                const pushPromises = nearbyDeliveryBoyIds.map(async (item: any) => {
                    const id = (item as any).deliveryBoyId || item;
                    const idString = id.toString().trim();
                    try {
                        await sendNotificationToUser(
                            idString,
                            'Delivery',
                            {
                                title: '🚚 New Delivery Order!',
                                body: `Order #${order.orderNumber} — ₹${order.total?.toFixed(2)} — Earn ₹${deliveryBoyEarning.toFixed(2)}`,
                                data: {
                                    type: 'new_order',
                                    orderId,
                                    orderNumber: String(order.orderNumber),
                                    // Ensures tapping the push notification opens the delivery dashboard
                                    // where the OrderNotificationCard will be visible via socket
                                    link: '/delivery',
                                }
                            }
                        );
                    } catch {
                        // Silently skip individual failures — socket is the primary channel
                    }
                });
                await Promise.allSettled(pushPromises);
                console.log(`📲 Sent push notification to ${nearbyDeliveryBoyIds.length} delivery boy(s) for order ${order.orderNumber}`);
            } catch (pushError) {
                console.error('Failed to send push notifications to delivery boys:', pushError);
            }
        }

        console.log(`📢 New order notification complete for ${order.orderNumber} — Targeted: ${notifiedIds.size}, Broadcast: ✅`);
    } catch (error) {
        console.error('Error notifying delivery boys:', error);
    }
}

/**
 * Handle order acceptance by a delivery boy
 */
export async function handleOrderAcceptance(
    io: SocketIOServer,
    orderId: string,
    deliveryBoyId: string
): Promise<{ success: boolean; message: string }> {
    try {
        const state = notificationStates.get(orderId);
        const normalizedDeliveryBoyId = String(deliveryBoyId).trim();

        // 1. In-Memory Check (Preferred)
        if (state) {
            // Check if already accepted in memory
            if (state.acceptedBy) {
                return { success: false, message: 'Order already accepted by another delivery boy' };
            }

            // Check if this delivery boy was notified (log only as warning)
            if (!state.notifiedDeliveryBoys.has(normalizedDeliveryBoyId)) {
               console.log(`ℹ️ Delivery boy ${normalizedDeliveryBoyId} accepted via broadcast/dashboard (not in initial target list)`);
               // Add them to the set so further logic works
               state.notifiedDeliveryBoys.add(normalizedDeliveryBoyId);
            }

            // Check if this delivery boy already rejected
            if (state.rejectedDeliveryBoys.has(normalizedDeliveryBoyId)) {
                return { success: false, message: 'You have already rejected this order' };
            }

            // Mark as accepted in memory
            state.acceptedBy = normalizedDeliveryBoyId;
        } else {
            console.log(`⚠️ Notification state missing for order ${orderId}. Checking database for fallback...`);
            // 2. Database Fallback (For server restarts/stale notifications)
            // We skip "notified" and "rejected" checks because that data is lost.
            // We assume if they have the ID, they were notified effectively.
        }

        // Update order in database
        const order = await Order.findById(orderId);
        if (!order) {
            return { success: false, message: 'Order not found' };
        }

        // Check if order already has a delivery boy assigned
        if (order.deliveryBoy) {
            return { success: false, message: 'Order already assigned to another delivery boy' };
        }

        // Assign order to delivery boy
        order.deliveryBoy = new mongoose.Types.ObjectId(normalizedDeliveryBoyId);
        order.deliveryBoyStatus = 'Assigned';
        order.assignedAt = new Date();
        order.status = 'Processed'; // Mark as processed when assigned

        await order.save();

        // Emit order-accepted event to stop notifications for all delivery boys
        io.to('delivery-notifications').emit('order-accepted', {
            orderId,
            acceptedBy: normalizedDeliveryBoyId,
        });

        // Also emit to individual rooms (notifiedId is already a string from Set)
        if (state) {
            for (const notifiedId of state.notifiedDeliveryBoys) {
                const notifiedIdString = String(notifiedId).trim();
                io.to(`delivery-${notifiedIdString}`).emit('order-accepted', {
                    orderId,
                    acceptedBy: normalizedDeliveryBoyId,
                });
            }
            // Clean up notification state
            notificationStates.delete(orderId);
        } else {
            // If no state, we can't emit to specific originally notified list,
            // but 'delivery-notifications' room covers the general case.
            // We can also try to emit to the accepting delivery boy just in case
            io.to(`delivery-${normalizedDeliveryBoyId}`).emit('order-accepted', {
                orderId,
                acceptedBy: normalizedDeliveryBoyId,
            });
        }

        // Emit delivery-boy-accepted event to customer for tracking
        io.to(`order-${orderId}`).emit('delivery-boy-accepted', {
            orderId,
            deliveryBoyId: normalizedDeliveryBoyId,
            message: 'Delivery boy accepted your order. Tracking started.',
        });

        console.log(`✅ Order ${orderId} accepted by delivery boy ${normalizedDeliveryBoyId} ${state ? '(Memory)' : '(DB Fallback)'}`);
        return { success: true, message: 'Order accepted successfully' };
    } catch (error) {
        console.error('Error handling order acceptance:', error);
        return { success: false, message: 'Error accepting order' };
    }
}

/**
 * Handle order rejection by a delivery boy
 */
export async function handleOrderRejection(
    io: SocketIOServer,
    orderId: string,
    deliveryBoyId: string
): Promise<{ success: boolean; message: string; allRejected: boolean }> {
    try {
        const state = notificationStates.get(orderId);

        if (!state) {
            return { success: false, message: 'Order notification not found', allRejected: false };
        }

        // Check if already accepted
        if (state.acceptedBy) {
            return { success: false, message: 'Order already accepted', allRejected: false };
        }

        // Check if this delivery boy was notified (individually or via broadcast)
        const normalizedDeliveryBoyId = String(deliveryBoyId).trim();
        if (!state.notifiedDeliveryBoys.has(normalizedDeliveryBoyId)) {
            // Allow delivery boys who received the notification via the general broadcast room
            // to also reject. Add them to the tracked set on first interaction.
            console.log(`ℹ️ Delivery boy ${normalizedDeliveryBoyId} received notification via broadcast; adding to notified set for rejection tracking`);
            state.notifiedDeliveryBoys.add(normalizedDeliveryBoyId);
        }

        // Check if already rejected
        if (state.rejectedDeliveryBoys.has(normalizedDeliveryBoyId)) {
            return { success: true, message: 'You have already rejected this order', allRejected: false };
        }

        // Mark as rejected
        state.rejectedDeliveryBoys.add(normalizedDeliveryBoyId);

        // Check if all delivery boys have rejected
        const allRejected = state.rejectedDeliveryBoys.size === state.notifiedDeliveryBoys.size;

        if (allRejected) {
            // Emit order-rejected-by-all event
            io.to('delivery-notifications').emit('order-rejected-by-all', {
                orderId,
            });

            try {
                // Update order in database to "Rejected"
                const order = await Order.findById(orderId);
                if (order) {
                    order.status = 'Rejected';
                    order.deliveryBoyStatus = 'Failed';
                    order.adminNotes = (order.adminNotes ? order.adminNotes + '\n' : '') +
                        `[${new Date().toISOString()}] Rejected: All notified delivery boys (${state.notifiedDeliveryBoys.size}) rejected the order.`;
                    await order.save();

                    // Notify customer via socket
                    io.to(`order-${orderId}`).emit('order-rejected', {
                        orderId,
                        message: 'Unfortunately, no delivery partner is available at the moment. Your order has been rejected.',
                    });

                    // Notify warehouses/restaurants
                    notifyWarehousesOfOrderUpdate(io, order, 'STATUS_UPDATE');

                    console.log(`✅ All delivery boys rejected order ${orderId}. Order status updated to Rejected.`);
                } else {
                    console.error(`❌ Order ${orderId} not found when trying to update rejection status`);
                }
            } catch (dbError) {
                console.error(`❌ Error updating order ${orderId} to Rejected status:`, dbError);
                // We still proceed with cleanup to avoid memory leaks/stuck state
            }

            // Clean up notification state
            notificationStates.delete(orderId);
        } else {
            // Emit rejection acknowledgment to the specific delivery boy
            io.to(`delivery-${deliveryBoyId}`).emit('order-rejection-acknowledged', {
                orderId,
            });
        }

        console.log(`🚫 Delivery boy ${deliveryBoyId} rejected order ${orderId}`);
        return { success: true, message: 'Order rejected', allRejected };
    } catch (error) {
        console.error('Error handling order rejection:', error);
        return { success: false, message: 'Error rejecting order', allRejected: false };
    }
}

/**
 * Get notification state for an order
 */
export function getNotificationState(orderId: string): OrderNotificationState | undefined {
    return notificationStates.get(orderId);
}

/**
 * Clean up notification state (for testing or manual cleanup)
 */
export function clearNotificationState(orderId: string): void {
    notificationStates.delete(orderId);
}

