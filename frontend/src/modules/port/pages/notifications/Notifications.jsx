import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '../../components/common/PageTitle';
import { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../../../services/api/portNotificationService';
import { useToast } from '../../../../context/ToastContext';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getMyNotifications();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await markAsRead(id);
      if (response.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllAsRead();
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        showToast('All notifications marked as read', 'success');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      showToast('Failed to mark all as read', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await deleteNotification(id);
      if (response.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
        showToast('Notification deleted', 'success');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      showToast('Failed to delete notification', 'error');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Info': return { icon: 'info', color: 'bg-blue-100 text-blue-600' };
      case 'Success': return { icon: 'verified', color: 'bg-emerald-100 text-emerald-600' };
      case 'Warning': return { icon: 'warning', color: 'bg-amber-100 text-amber-600' };
      case 'Error': return { icon: 'error', color: 'bg-rose-100 text-rose-600' };
      case 'Order': return { icon: 'shopping_cart', color: 'bg-violet-100 text-violet-600' };
      case 'Payment': return { icon: 'payments', color: 'bg-indigo-100 text-indigo-600' };
      case 'System': return { icon: 'settings', color: 'bg-slate-100 text-slate-600' };
      default: return { icon: 'notifications', color: 'bg-slate-100 text-slate-600' };
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'just now';
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return date.toLocaleDateString();
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageTitle 
        title="Notification Center" 
        subtitle="Stay updated with requirements, offers and orders"
        actions={
          notifications.some(n => !n.isRead) && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-teal-600 text-sm font-bold hover:underline"
            >
              Mark all as read
            </button>
          )
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-icons-outlined text-4xl text-slate-300">notifications_off</span>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No notifications yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto">We'll notify you here when there are updates about your requirements or offers.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
          {notifications.map((notif) => {
            const { icon, color } = getIcon(notif.type);
            return (
              <div 
                key={notif._id} 
                onMouseEnter={() => !notif.isRead && handleMarkAsRead(notif._id)}
                className={`p-6 flex gap-4 transition-colors hover:bg-slate-50/50 ${!notif.isRead ? 'bg-teal-50/20' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${color}`}>
                  <span className="material-icons-outlined text-2xl">{icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm ${!notif.isRead ? 'font-bold' : 'font-semibold'} text-slate-800`}>{notif.title}</h4>
                    <span className="text-xs text-slate-400 font-medium">{formatTime(notif.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{notif.message}</p>
                  <div className="mt-3 flex items-center gap-4">
                    {notif.link && (
                      <button 
                        onClick={() => navigate(notif.link)}
                        className="text-xs font-bold text-teal-600 hover:underline"
                      >
                        View Details
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(notif._id)}
                      className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
