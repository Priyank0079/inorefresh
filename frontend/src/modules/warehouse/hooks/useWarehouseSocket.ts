import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import api, { getSocketBaseURL } from '../../../services/api/config';
import { useToast } from '../../../context/ToastContext';

export interface WarehouseNotification {
    type: 'NEW_ORDER' | 'STATUS_UPDATE' | 'ORDER_CANCELLED';
    orderId: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    customer: {
        name: string;
        email: string;
        phone: string;
        address: {
            address: string;
            city: string;
            state?: string;
            pincode: string;
            landmark?: string;
        };
    };
    items: Array<{
        productName: string;
        quantity: number;
        price: number;
        total: number;
        variation?: string;
    }>;
    totalAmount: number;
    timestamp: Date;
}

export interface ReturnOtpAlert {
    otp: string;
    orderId: string;
    orderNumber: string;
    returnId: string;
    timestamp: Date;
}

export interface ReturnRequestAlert {
    orderId: string;
    orderNumber: string;
    customerName: string;
    itemCount: number;
    timestamp: Date;
}

export const useWarehouseSocket = (
    onNotificationReceived?: (notification: WarehouseNotification) => void,
    onReturnOtp?: (alert: ReturnOtpAlert) => void,
    onReturnRequest?: (alert: ReturnRequestAlert) => void
) => {
    const { user, token, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { showToast } = useToast();
    // Orders we've already popped a return-request alert for — prevents the
    // reconnect catch-up from re-showing a popup the warehouse already saw.
    const shownReturnOrdersRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!isAuthenticated || !token || !user || user.userType !== 'Warehouse') {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const socketUrl = getSocketBaseURL();
        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            // Robust reconnection — critical so warehouse never misses order alerts
            reconnection: true,
            reconnectionAttempts: 20,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 15000,
            timeout: 20000,
            forceNew: false,
        });

        newSocket.on('connect', () => {
            console.log('✅ Warehouse connected to socket server:', newSocket.id);
            setIsConnected(true);

            const warehouseId = user.id;
            console.log('🏭 DEBUG: Emitting join-warehouse-room with warehouse ID:', {
                warehouseId,
                idType: typeof warehouseId,
                socketId: newSocket.id
            });

            // Always re-join room on (re)connect so we never miss notifications
            newSocket.emit('join-warehouse-room', warehouseId);

            // Catch-up: fetch any NEW_ORDER notifications saved in the bell while
            // the socket was briefly disconnected and surface a popup for unseen ones.
            if (onNotificationReceived) {
                api.get('/warehouse/notifications?limit=5')
                    .then((res: any) => {
                        const list: any[] = res?.data?.data || [];
                        const recent = list.filter((n: any) =>
                            !n.isRead &&
                            n.type === 'Order' &&
                            n.title?.includes('New Order')
                        );
                        if (recent.length === 0) return;
                        // Surface a synthetic notification for the newest unread order alert
                        const newest = recent[0];
                        onNotificationReceived({
                            type: 'NEW_ORDER',
                            orderId: newest.link?.split('/').pop() || '',
                            orderNumber: newest.message?.match(/#(\S+)/)?.[1] || '',
                            status: 'Pending',
                            paymentStatus: '',
                            customer: { name: '', email: '', phone: '', address: { address: '', city: '', pincode: '' } },
                            items: [],
                            totalAmount: 0,
                            timestamp: new Date(newest.createdAt),
                        });
                    })
                    .catch(() => { /* non-fatal */ });
            }

            // Catch-up: a popup emitted while we were briefly disconnected is lost
            // (socket events aren't queued). On every (re)connect, pull returns
            // still awaiting approval and surface a popup for any we haven't shown.
            if (onReturnRequest) {
                api.get('/returns?status=All Status')
                    .then((res: any) => {
                        const list: any[] = res?.data?.data || [];
                        const pending = list.filter((r) =>
                            (r.status === 'REQUESTED' || r.status === 'Pending') &&
                            r.orderId && !shownReturnOrdersRef.current.has(String(r.orderId))
                        );
                        if (pending.length === 0) return;
                        pending.forEach((p) => shownReturnOrdersRef.current.add(String(p.orderId)));
                        const newest = pending[0];
                        onReturnRequest({
                            orderId: String(newest.orderId || ''),
                            orderNumber: String(newest.orderNumber || newest.orderId || ''),
                            customerName: newest.customerName || newest.shopName || 'Customer',
                            itemCount: pending.length,
                            timestamp: new Date(),
                        });
                    })
                    .catch(() => { /* non-fatal — bell + push still cover it */ });
            }
        });

        newSocket.on('joined-warehouse-room', (data) => {
            console.log('✅ Joined warehouse notification room:', {
                warehouseId: data.warehouseId,
                rooms: ['warehouse-notifications', `warehouse-${data.warehouseId}`]
            });
        });

        newSocket.on('warehouse-notification', (notification: WarehouseNotification) => {
            console.log('🔔 New warehouse notification received:', {
                type: notification.type,
                orderNumber: notification.orderNumber,
                orderId: notification.orderId,
                timestamp: new Date().toISOString()
            });
            if (onNotificationReceived) {
                onNotificationReceived(notification);
            }
        });

        newSocket.on('return-otp-alert', (alert: ReturnOtpAlert) => {
            console.log('🔐 Return pickup OTP received:', {
                orderNumber: alert.orderNumber,
                returnId: alert.returnId,
            });
            if (onReturnOtp) {
                onReturnOtp(alert);
            }
        });

        newSocket.on('return-request-alert', (alert: ReturnRequestAlert) => {
            console.log('↩️ New return request received:', {
                orderNumber: alert.orderNumber,
                itemCount: alert.itemCount,
            });
            // Mark as shown so the reconnect catch-up won't re-popup this order.
            if (alert.orderId) shownReturnOrdersRef.current.add(String(alert.orderId));
            if (onReturnRequest) {
                onReturnRequest(alert);
            }
        });

        newSocket.on('delivery-update', (data: any) => {
            console.log('🚚 Delivery update received:', data);
            showToast(`Port Shipment update: ${data.status}`, 'info');
        });

        newSocket.on('disconnect', (reason) => {
            console.warn('⚠️ Warehouse disconnected from socket server:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Warehouse socket connection error:', error.message);
            setIsConnected(false);
        });

        newSocket.on('reconnect', (attempt) => {
            console.log(`🔄 Warehouse socket reconnected after ${attempt} attempt(s)`);
        });

        newSocket.on('reconnect_failed', () => {
            console.error('❌ Warehouse socket max reconnection attempts reached');
            showToast('Lost connection to notification server. Please refresh the page.', 'error');
        });

        setSocket(newSocket);

        return () => {
            newSocket.removeAllListeners();
            newSocket.disconnect();
        };
    }, [isAuthenticated, token, user?.id, user?.userType]);

    return { socket, isConnected };
};
