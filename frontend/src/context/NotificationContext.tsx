import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api, { getSocketBaseURL } from '../services/api/config';
import { io, Socket } from 'socket.io-client';
import { useToast } from './ToastContext';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'Info' | 'Success' | 'Warning' | 'Error' | 'Order' | 'Payment' | 'System';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!token || !user) return;
    
    setLoading(true);
    try {
      // Determine module prefix based on user type
      let modulePrefix = '';
      if (user.userType === 'Admin') modulePrefix = 'admin';
      else if (user.userType === 'Warehouse') modulePrefix = 'warehouse';
      else if (user.userType === 'Port') modulePrefix = 'port';
      else if (user.userType === 'Delivery') modulePrefix = 'delivery';
      else if (user.userType === 'Customer' || user.userType === 'horeca' || user.userType === 'retailer') modulePrefix = 'customer';
      
      if (!modulePrefix) {
        console.warn('[NotificationContext] Unknown user type:', user.userType);
        setLoading(false);
        return;
      }

      const response = await api.get(`/${modulePrefix}/notifications`);
      
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.data.filter((n: any) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const markAsRead = useCallback(async (id: string) => {
    if (!token || !user) return;
    
    try {
      let modulePrefix = '';
      if (user.userType === 'Admin') modulePrefix = 'admin';
      else if (user.userType === 'Warehouse') modulePrefix = 'warehouse';
      else if (user.userType === 'Port') modulePrefix = 'port';
      else if (user.userType === 'Delivery') modulePrefix = 'delivery';
      else if (user.userType === 'Customer' || user.userType === 'horeca' || user.userType === 'retailer') modulePrefix = 'customer';
      
      if (!modulePrefix) return;

      const response = await api.patch(`/${modulePrefix}/notifications/${id}/read`);
      
      if (response.data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [token, user]);

  const markAllAsRead = useCallback(async () => {
    if (!token || !user || notifications.length === 0) return;
    
    try {
      let modulePrefix = '';
      let method: 'post' | 'patch' = 'patch';
      let endpoint = '';

      if (user.userType === 'Admin') {
        endpoint = '/admin/notifications/mark-read';
        method = 'patch';
      } else if (user.userType === 'Port') {
        endpoint = '/port/notifications/mark-all-read';
        method = 'patch';
      } else if (user.userType === 'Warehouse') {
        endpoint = '/warehouse/notifications/mark-all-read';
        method = 'patch';
      } else if (user.userType === 'Delivery') {
        endpoint = '/delivery/notifications/mark-all-read';
        method = 'patch';
      } else if (user.userType === 'Customer' || user.userType === 'horeca' || user.userType === 'retailer') {
        endpoint = '/customer/notifications/mark-all-read';
        method = 'patch';
      }

      if (!endpoint) return;
      
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
      if (unreadIds.length === 0) return;

      const response = await api[method](endpoint, { notificationIds: unreadIds });
      
      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [token, user, notifications]);

  useEffect(() => {
    if (token && user) {
      fetchNotifications();
      
      let newSocket: Socket | null = null;
      
      // Delay connection slightly to avoid React 18 Strict Mode double-invoke WebSocket errors
      const timeoutId = setTimeout(() => {
        const socketUrl = getSocketBaseURL();
        newSocket = io(socketUrl, {
          auth: { token },
          // Prevent infinite reconnect loops that hang the browser on a slow server
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
          timeout: 10000,
          transports: ['websocket', 'polling'],
        });
        
        newSocket.on('connect', () => {
          console.log('Connected to notification socket');
          // Join specific room based on user type and ID
          const userId = user.userId || user.id || user._id;
          
          if (user.userType === 'Admin') {
            newSocket?.emit('join-admin-room');
          } else if (user.userType === 'Warehouse') {
            newSocket?.emit('join-warehouse-room', userId);
          } else if (user.userType === 'Port') {
            newSocket?.emit('join-port-room', userId);
          } else if (user.userType === 'Customer' || user.userType === 'horeca' || user.userType === 'retailer') {
            newSocket?.emit('join-customer-room', userId);
          } else if (user.userType === 'Delivery') {
            newSocket?.emit('join-delivery-notifications', userId);
          }
        });

        newSocket.on('new-notification', (notification: Notification) => {
          console.log('New real-time notification received:', notification);
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show a toast when a new notification is received
          showToast(notification.title, 'info');

          // Play notification beep sound using Web Audio API
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              const audioCtx = new AudioContextClass();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
              gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
              
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.18);
            }
          } catch (audioErr) {
            console.error("Audio beep failed:", audioErr);
          }

          // Text-to-speech voice alert
          try {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel(); // Cancel any ongoing speech
              const textToSpeak = `${notification.title}. ${notification.message}`;
              const utterance = new SpeechSynthesisUtterance(textToSpeak);
              utterance.rate = 1.0;
              utterance.pitch = 1.0;
              window.speechSynthesis.speak(utterance);
            }
          } catch (speechError) {
            console.error("Speech Synthesis failed:", speechError);
          }
        });

        setSocket(newSocket);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        if (newSocket) newSocket.disconnect();
      };
    }
  }, [token, user, fetchNotifications]);

  const contextValue = React.useMemo(() => ({ 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  }), [notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
