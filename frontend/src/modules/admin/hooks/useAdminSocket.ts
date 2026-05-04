import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { getSocketBaseURL } from '@/services/api/config';
import { useToast } from '@/context/ToastContext';

export const useAdminSocket = (onNewOffer?: (offer: any) => void) => {
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
        });

        newSocket.on('connect', () => {
            console.log('👑 Admin connected to socket server');
            setIsConnected(true);

            // Join admin-specific room to receive notifications
            newSocket.emit('join-admin-room');
        });

        newSocket.on('joined-admin-room', (data) => {
            console.log('👑 Joined admin notification room');
        });

        newSocket.on('new-port-offer', (data: any) => {
            console.log('🔔 New port offer received:', data);
            
            // Show a toast/popup
            showToast(`New offer from ${data.portName} for ${data.fishName} (₹${data.offeredPrice}/kg)`, 'info');
            
            if (onNewOffer) {
                onNewOffer(data);
            }
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Admin disconnected from socket server');
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [isAuthenticated, token, user?.id, user?.userType]);

    return { socket, isConnected };
};
