import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { getSocketBaseURL } from '@/services/api/config';
import { useToast } from '@/context/ToastContext';

export const useAdminSocket = (
    onNewOffer?: (offer: any) => void,
    onAlert?: (alert: { title: string; message: string }) => void
) => {
    const { user, token, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (!isAuthenticated || !token || !user || user.userType !== 'Admin') {
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
            // Robust reconnection for admin — ensures real-time order/offer alerts never drop
            reconnection: true,
            reconnectionAttempts: 20,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 15000,
            timeout: 20000,
            forceNew: false,
        });

        newSocket.on('connect', () => {
            console.log('👑 Admin connected to socket server:', newSocket.id);
            setIsConnected(true);
            // Always re-join room on (re)connect
            newSocket.emit('join-admin-room');
        });

        newSocket.on('joined-admin-room', (_data: any) => {
            console.log('👑 Joined admin notification room');
        });

        // Prefer the prominent popup when a handler is provided; else fall back to a toast.
        const fireAlert = (title: string, message: string) => {
            if (onAlert) onAlert({ title, message });
            else showToast(message, 'info');
        };

        // New order placed by customer → popup + badge update
        newSocket.on('new-order-admin', (data: any) => {
            console.log('🛒 New order received (admin):', data.orderNumber);
            fireAlert('🛒 New Order', `New Order #${data.orderNumber} from ${data.customerName} — ₹${data.total}`);
            if (onNewOffer) onNewOffer({ type: 'new_order', ...data });
        });

        // Payment confirmed for an online order
        newSocket.on('new-paid-order', (data: any) => {
            console.log('💰 Payment confirmed for order:', data.orderNumber);
            fireAlert('💰 Payment Confirmed', `Payment confirmed for Order #${data.orderNumber}`);
        });

        newSocket.on('new-port-offer', (data: any) => {
            console.log('🔔 New port offer received:', data);
            fireAlert('🔔 New Port Offer', `New offer from ${data.portName} for ${data.fishName} (₹${data.offeredPrice}/kg)`);
            if (onNewOffer) onNewOffer(data);
        });

        // New delivery boy registered — admin must approve/activate
        newSocket.on('new-delivery-registration', (data: any) => {
            console.log('🚚 New delivery boy registration:', data.name);
            fireAlert(data.title || '🚚 New Delivery Boy Registration', data.message || 'A new delivery boy is pending approval.');
        });

        // Negative-balance refund popup — admin needs to act
        newSocket.on('return-refund-alert', (data: any) => {
            console.log('⚠️ Return refund alert (negative balance):', data);
            fireAlert(data.title || '⚠️ Warehouse Balance Negative', data.message || 'Action required.');
        });

        newSocket.on('delivery-update', (data: any) => {
            console.log('🚚 Delivery update received by Admin:', data);
            showToast(`Port Shipment update: ${data.status}`, 'info');
        });

        newSocket.on('disconnect', (reason: string) => {
            console.warn('⚠️ Admin disconnected from socket server:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error: Error) => {
            console.error('❌ Admin socket connection error:', error.message);
            setIsConnected(false);
        });

        newSocket.on('reconnect', (attempt: number) => {
            console.log(`🔄 Admin socket reconnected after ${attempt} attempt(s)`);
        });

        setSocket(newSocket);

        return () => {
            newSocket.removeAllListeners();
            newSocket.disconnect();
        };
    }, [isAuthenticated, token, user?.id, user?.userType]);

    return { socket, isConnected };
};
