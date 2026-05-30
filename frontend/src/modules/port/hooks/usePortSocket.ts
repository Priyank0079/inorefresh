import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { getSocketBaseURL } from '@/services/api/config';
import { useToast } from '@/context/ToastContext';


export const usePortSocket = (onNewRequirement?: (requirement: any) => void) => {
    const { user, token, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (!isAuthenticated || !token || !user || user.userType !== 'Port') {
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
            console.log('⚓ Port connected to socket server');
            setIsConnected(true);

            // Join port-specific room to receive requirement updates
            newSocket.emit('join-port-room', user.id);
        });

        newSocket.on('joined-port-room', (data) => {
            console.log('⚓ Joined port notification room:', data.portId);
        });

        newSocket.on('new-requirement', (data: any) => {
            console.log('🔔 New port requirement received:', data);
            showToast(`New requirement for ${data.requirement?.fishName}`, 'info');
            if (onNewRequirement) {
                onNewRequirement(data.requirement);
            }
        });

        newSocket.on('new-counter-offer', (data: any) => {
            console.log('🔔 Admin counter offer received:', data);
            showToast(data.message || 'Admin has sent a counter offer', 'info');
        });

        newSocket.on('offer-approved', (data: any) => {
            console.log('✅ Offer approved by Admin:', data);
            showToast('Your offer has been approved and confirmed!', 'success');
        });
        
        newSocket.on('delivery-update', (data: any) => {
            console.log('🚚 Delivery update received:', data);
            showToast(`Shipment status updated: ${data.status}`, 'info');
        });

        newSocket.on('disconnect', (reason) => {
            console.log(`❌ Port disconnected from socket server. Reason: ${reason}`);
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [isAuthenticated, token, user?.id, user?.userType]);

    return { socket, isConnected };
};
