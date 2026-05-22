import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import { getSocketBaseURL } from '../../../services/api/config';
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

export const useWarehouseSocket = (onNotificationReceived?: (notification: WarehouseNotification) => void) => {
    const { user, token, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { showToast } = useToast();

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
            // Always re-join room on (re)connect so we never miss notifications
            newSocket.emit('join-warehouse-room', user.id);
        });

        newSocket.on('joined-warehouse-room', (data) => {
            console.log('📦 Joined warehouse notification room:', data.warehouseId);
        });

        newSocket.on('warehouse-notification', (notification: WarehouseNotification) => {
            console.log('🔔 New warehouse notification received:', notification.type, notification.orderNumber);
            if (onNotificationReceived) {
                onNotificationReceived(notification);
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
