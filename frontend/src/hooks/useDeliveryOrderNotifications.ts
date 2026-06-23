import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { OrderNotificationData } from '../services/api/delivery/deliveryOrderNotificationService';
import { acceptOrder, rejectOrder } from '../services/api/delivery/deliveryOrderNotificationService';
import { getSocketBaseURL } from '../services/api/config';

export interface ReturnPickupAlert {
    returnId: string;
    orderId: string;
    orderNumber: string;
    customerName: string;
    otp?: string;
    timestamp: Date;
}

interface NotificationState {
    currentNotification: OrderNotificationData | null;
    notificationQueue: OrderNotificationData[];
    returnPickupAlert: ReturnPickupAlert | null;
    isConnected: boolean;
    error: string | null;
}

export const useDeliveryOrderNotifications = () => {
    const { isAuthenticated, user } = useAuth();
    const [state, setState] = useState<NotificationState>({
        currentNotification: null,
        notificationQueue: [],
        returnPickupAlert: null,
        isConnected: false,
        error: null,
    });

    const socketRef = useRef<Socket | null>(null);

    const connectSocket = useCallback(() => {
        if (!isAuthenticated || user?.userType !== 'Delivery' || !user?.id) {
            return null;
        }

        // If already connected, don't create a new socket
        if (socketRef.current?.connected) {
            return socketRef.current;
        }

        // Clean up any existing disconnected socket
        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        const token = localStorage.getItem('authToken');
        const socket = io(getSocketBaseURL(), {
            auth: { token },
            // Allow both websocket and polling — polling is the fallback for
            // environments where websocket upgrades are blocked (e.g., some nginx configs)
            transports: ['websocket', 'polling'],
            // Let socket.io-client handle reconnection automatically
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 15000,
            timeout: 20000,
            // Force new connection each time (avoids sharing with other socket instances)
            forceNew: false,
        });

        socketRef.current = socket;

        // ---- Connection lifecycle ----
        socket.on('connect', () => {
            console.log('🔌 Delivery socket connected:', socket.id);
            setState(prev => ({ ...prev, isConnected: true, error: null }));
            // Join notification rooms immediately on (re)connect
            socket.emit('join-delivery-notifications', user.id);
        });

        socket.on('joined-notifications-room', (data: any) => {
            console.log('✅ Joined delivery notifications room:', data.deliveryBoyId);
        });

        socket.on('disconnect', (reason: string) => {
            console.warn('⚠️ Delivery socket disconnected:', reason);
            setState(prev => ({ ...prev, isConnected: false }));
            // socket.io-client auto-reconnects unless we explicitly called disconnect()
        });

        socket.on('connect_error', (error: Error) => {
            console.error('❌ Delivery socket connection error:', error.message);
            setState(prev => ({
                ...prev,
                isConnected: false,
                error: `Connection failed: ${error.message}`,
            }));
        });

        socket.on('reconnect', (attempt: number) => {
            console.log(`🔄 Delivery socket reconnected after ${attempt} attempt(s)`);
            setState(prev => ({ ...prev, error: null }));
        });

        socket.on('reconnect_failed', () => {
            console.error('❌ Delivery socket max reconnection attempts reached');
            setState(prev => ({
                ...prev,
                error: 'Unable to connect to notification server. Please refresh the page.',
            }));
        });

        // ---- Order notification events ----
        socket.on('new-order', (orderData: OrderNotificationData) => {
            console.log('📦 New order notification received:', orderData.orderNumber, orderData.orderId);

            // Let other delivery screens (e.g. the dashboard counts) refresh live.
            window.dispatchEvent(new CustomEvent('delivery:orders-changed'));

            setState(prev => {
                // Deduplicate: ignore if the same order is already shown or queued
                const isDuplicate =
                    prev.currentNotification?.orderId === orderData.orderId ||
                    prev.notificationQueue.some(n => n.orderId === orderData.orderId);

                if (isDuplicate) {
                    console.log('⚠️ Duplicate order notification ignored:', orderData.orderId);
                    return prev;
                }

                if (prev.currentNotification) {
                    // Queue the new notification
                    return { ...prev, notificationQueue: [...prev.notificationQueue, orderData] };
                }
                // Show immediately
                return { ...prev, currentNotification: orderData };
            });
        });

        socket.on('order-accepted', (data: { orderId: string; acceptedBy: string }) => {
            console.log('✅ Order taken by another delivery boy:', data.orderId);
            window.dispatchEvent(new CustomEvent('delivery:orders-changed'));
            setState(prev => {
                if (prev.currentNotification?.orderId === data.orderId) {
                    const next = prev.notificationQueue[0] || null;
                    return { ...prev, currentNotification: next, notificationQueue: prev.notificationQueue.slice(1) };
                }
                return { ...prev, notificationQueue: prev.notificationQueue.filter(n => n.orderId !== data.orderId) };
            });
        });

        socket.on('order-rejected-by-all', (data: { orderId: string }) => {
            console.log('❌ Order rejected by all, clearing notification:', data.orderId);
            setState(prev => {
                if (prev.currentNotification?.orderId === data.orderId) {
                    const next = prev.notificationQueue[0] || null;
                    return { ...prev, currentNotification: next, notificationQueue: prev.notificationQueue.slice(1) };
                }
                return { ...prev, notificationQueue: prev.notificationQueue.filter(n => n.orderId !== data.orderId) };
            });
        });

        // ---- Return pickup popup (warehouse approved a return → go collect) ----
        socket.on('return-pickup-alert', (data: ReturnPickupAlert) => {
            console.log('↩️ Return pickup alert received:', data.orderNumber);
            setState(prev => ({ ...prev, returnPickupAlert: data }));
        });

        // ---- Bell notifications for delivery (new-notification) ----
        // NotificationContext skips socket creation for Delivery to avoid duplicate
        // room joins. We handle new-notification here and broadcast a DOM event so
        // NotificationContext can refetch its list without knowing about sockets.
        socket.on('new-notification', (data: any) => {
            window.dispatchEvent(new CustomEvent('delivery:bell-refresh', { detail: data }));
        });
        socket.on('error', (err: any) => {
            console.error('Socket error:', err);
        });

        return socket;
    }, [isAuthenticated, user]);

    const disconnectSocket = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setState(prev => ({ ...prev, isConnected: false }));
    }, []);

    // ---- Lifecycle management ----
    useEffect(() => {
        if (!isAuthenticated || user?.userType !== 'Delivery' || !user?.id) {
            disconnectSocket();
            return;
        }

        // Delay connection slightly to avoid React 18 Strict Mode double-invoke WebSocket errors
        const timeoutId = setTimeout(() => {
            connectSocket();
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            disconnectSocket();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.id, user?.userType]);

    // ---- Order action handlers ----
    const handleAccept = useCallback(async (orderId: string, navigate?: (path: string) => void) => {
        if (!socketRef.current?.connected || !user?.id) {
            return { success: false, message: 'Not connected or user not found' };
        }

        try {
            const result = await acceptOrder(socketRef.current, orderId, user.id);

            if (result.success) {
                // Remove from UI immediately on successful acceptance
                setState(prev => {
                    const next = prev.notificationQueue[0] || null;
                    return { ...prev, currentNotification: next, notificationQueue: prev.notificationQueue.slice(1) };
                });
                if (navigate) navigate(`/delivery/orders/${orderId}`);
            } else if (result.message === 'Order notification not found') {
                // Stale notification — clear it from UI
                console.warn('⚠️ Stale notification cleared:', orderId);
                setState(prev => {
                    const next = prev.notificationQueue[0] || null;
                    return { ...prev, currentNotification: next, notificationQueue: prev.notificationQueue.slice(1) };
                });
            }

            return result;
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to accept order' };
        }
    }, [user]);

    const handleReject = useCallback(async (orderId: string) => {
        if (!socketRef.current?.connected || !user?.id) {
            return { success: false, message: 'Not connected or user not found', allRejected: false };
        }

        // Optimistically remove from UI right away for a snappy feel
        setState(prev => {
            const next = prev.notificationQueue[0] || null;
            return { ...prev, currentNotification: next, notificationQueue: prev.notificationQueue.slice(1) };
        });

        try {
            const result = await rejectOrder(socketRef.current, orderId, user.id);
            return result;
        } catch (error: any) {
            console.error('Failed to reject order:', error);
            return { success: false, message: error.message || 'Failed to reject order', allRejected: false };
        }
    }, [user]);

    const clearCurrentNotification = useCallback(() => {
        setState(prev => {
            const next = prev.notificationQueue[0] || null;
            return { ...prev, currentNotification: next, notificationQueue: prev.notificationQueue.slice(1) };
        });
    }, []);

    const clearReturnPickupAlert = useCallback(() => {
        setState(prev => ({ ...prev, returnPickupAlert: null }));
    }, []);

    // Listen for FCM foreground return-pickup events dispatched by DeliveryLayout.
    // This fires when the socket is momentarily down but FCM still delivers the push.
    useEffect(() => {
        const handleFcmReturnPickup = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (!detail?.orderId) return;
            setState(prev => ({
                ...prev,
                returnPickupAlert: {
                    returnId: detail.returnId || '',
                    orderId: detail.orderId,
                    orderNumber: detail.orderNumber || '',
                    customerName: detail.customerName || 'Customer',
                    timestamp: new Date(),
                },
            }));
        };
        window.addEventListener('fcm:return-pickup', handleFcmReturnPickup);
        return () => window.removeEventListener('fcm:return-pickup', handleFcmReturnPickup);
    }, []);

    return {
        currentNotification: state.currentNotification,
        notificationQueue: state.notificationQueue,
        returnPickupAlert: state.returnPickupAlert,
        isConnected: state.isConnected,
        error: state.error,
        acceptOrder: handleAccept,
        rejectOrder: handleReject,
        clearNotification: clearCurrentNotification,
        clearReturnPickupAlert,
        socket: socketRef.current,
    };
};
