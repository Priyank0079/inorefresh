import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api, { getSocketBaseURL } from '../services/api/config';
import { io, Socket } from 'socket.io-client';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!token || !user) return;
    
    setLoading(true);
    try {
      // Determine module prefix based on user type
      let modulePrefix = 'admin';
      if (user.userType === 'Warehouse') modulePrefix = 'warehouse';
      if (user.userType === 'Port') modulePrefix = 'port';
      if (user.userType === 'Delivery') modulePrefix = 'delivery';
      
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

  const markAsRead = async (id: string) => {
    if (!token || !user) return;
    
    try {
      let modulePrefix = 'admin';
      if (user.userType === 'Warehouse') modulePrefix = 'warehouse';
      if (user.userType === 'Port') modulePrefix = 'port';
      
      const response = await api.patch(`/${modulePrefix}/notifications/${id}/read`);
      
      if (response.data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!token || !user || notifications.length === 0) return;
    
    try {
      let modulePrefix = 'admin';
      let method: 'post' | 'patch' = 'patch';
      let endpoint = `/${modulePrefix}/notifications/mark-all-read`;

      if (user.userType === 'Admin') {
        endpoint = '/admin/notifications/mark-read';
        method = 'patch';
      } else if (user.userType === 'Port') {
        endpoint = '/port/notifications/mark-all-read';
        method = 'patch';
      } else if (user.userType === 'Warehouse') {
        endpoint = '/warehouse/notifications/mark-all-read';
        method = 'patch';
      }
      
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
  };

  useEffect(() => {
    if (token && user) {
      fetchNotifications();
      
      // Initialize Socket with shared config
      const socketUrl = getSocketBaseURL();
      const newSocket = io(socketUrl, {
        auth: { token }
      });
      
      newSocket.on('connect', () => {
        console.log('Connected to notification socket');
        // Join specific room based on user type and ID
        const userId = user.userId || user.id || user._id;
        
        if (user.userType === 'Admin') {
          newSocket.emit('join-admin-room');
        } else if (user.userType === 'Warehouse') {
          newSocket.emit('join-warehouse-room', userId);
        } else if (user.userType === 'Port') {
          newSocket.emit('join-port-room', userId);
        } else if (user.userType === 'Delivery') {
          newSocket.emit('join-delivery-notifications', userId);
        }
      });

      newSocket.on('new-notification', (notification: Notification) => {
        console.log('New real-time notification received:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      setSocket(newSocket);
      
      return () => {
        newSocket.disconnect();
      };
    }
  }, [token, user, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      loading, 
      fetchNotifications, 
      markAsRead, 
      markAllAsRead 
    }}>
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
