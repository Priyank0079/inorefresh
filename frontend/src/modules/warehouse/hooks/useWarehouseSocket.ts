import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import { getSocketBaseURL } from '../../../services/api/config';

export interface WarehouseNotification {
    type: 'NEW_ORDER' | 'STATUS_UPDATE';
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
        });

        newSocket.on('connect', () => {
            console.log('✅ Warehouse connected to socket server');
            setIsConnected(true);

            // Join Warehouse room
            newSocket.emit('join-Warehouse-room', user.id);
        });

        newSocket.on('joined-Warehouse-room', (data) => {
            console.log('📦 Joined Warehouse notification room:', data.WarehouseId);
        });

        newSocket.on('Warehouse-notification', (notification: WarehouseNotification) => {
            console.log('🔔 New Warehouse notification received:', notification);
            if (onNotificationReceived) {
                onNotificationReceived(notification);
            }
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Warehouse disconnected from socket server');
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [isAuthenticated, token, user?.id, user?.userType]);

    return { socket, isConnected };
};
