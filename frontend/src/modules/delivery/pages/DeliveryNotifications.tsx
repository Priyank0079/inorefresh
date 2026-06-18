import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeliveryHeader from '../components/DeliveryHeader';
import DeliveryBottomNav from '../components/DeliveryBottomNav';
import { getNotifications, markNotificationRead } from '../../../services/api/delivery/deliveryService';

export default function DeliveryNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveLink = (notification: any): string | null => {
    const link: string = notification.link || '';
    const title = (notification.title || '').toLowerCase();

    // Return OTP → go to route stops (driver enters OTP on stop page)
    if (title.includes('return otp') || title.includes('return pickup')) {
      return '/delivery/route/today';
    }

    // Route assigned / delivery confirmed → route page
    if (title.includes('route assigned') || title.includes('delivery confirmed') || title.includes('vehicle loaded')) {
      return '/delivery/route/today';
    }

    // Loading OTP / delivery OTP → route page
    if (title.includes('loading otp') || title.includes('delivery otp') || title.includes('otp requested')) {
      return '/delivery/route/today';
    }

    // Return submitted → route page
    if (title.includes('return submitted')) {
      return '/delivery/route/today';
    }

    if (link === '/delivery/orders') return '/delivery';
    if (link && link.startsWith('/delivery')) return link;

    const orderIdMatch = (notification.message || '').match(/#(ORD[A-Z0-9]+)/);
    if (orderIdMatch) return '/delivery';

    return null;
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification._id);
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
      } catch {
        // non-fatal
      }
    }
    const dest = resolveLink(notification);
    if (dest) navigate(dest);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Order':
      case 'order':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 8V6C5 4.34315 6.34315 3 8 3H16C17.6569 3 19 4.34315 19 6V8H21C21.5523 8 22 8.44772 22 9V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V9C2 8.44772 2.44772 8 3 8H5Z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M7 8V6C7 5.44772 7.44772 5 8 5H16C16.5523 5 17 5.44772 17 6V8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        );
      case 'Payment':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
        );
      case 'System':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#F97316">
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2 12 2C11.17 2 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" />
            </svg>
          </div>
        );
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-neutral-100 pb-20">
      <DeliveryHeader />
      <div className="px-4 py-4">
        <h2 className="text-neutral-900 text-xl font-semibold mb-4">Notifications</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 flex gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-200 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-40 bg-neutral-200 rounded animate-pulse" />
                  <div className="h-3 w-full bg-neutral-200 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-neutral-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer active:scale-[0.98] transition-all ${
                  notification.isRead
                    ? 'border-neutral-200'
                    : 'border-orange-200 bg-orange-50'
                }`}
              >
                <div className="flex gap-3 items-start">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-900 leading-snug">
                      {notification.title}
                    </h3>
                    <p className="text-neutral-600 text-xs mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-neutral-400 text-[10px]">
                        {formatTime(notification.createdAt)}
                      </p>
                      {resolveLink(notification) && (
                        <span className="text-teal-600 text-[10px] font-medium">
                          Tap to view →
                        </span>
                      )}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-1 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 min-h-[400px] flex items-center justify-center shadow-sm border border-neutral-200">
            <p className="text-neutral-500 text-sm">No notifications</p>
          </div>
        )}
      </div>
      <DeliveryBottomNav />
    </div>
  );
}
