import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleView = (notification: any) => {
    markAsRead(notification._id);
    navigate(`/notifications/${notification._id}`, { state: { notification } });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-teal-600 to-teal-700 pb-5 pt-5 px-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
            aria-label="Back"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18L9 12L15 6" />
            </svg>
          </button>

          <div className="text-center flex-1">
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            <p className="text-teal-100 text-xs mt-0.5">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p>
          </div>

          {unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 bg-white/20 text-white rounded-full text-xs font-bold hover:bg-white/30 transition-all whitespace-nowrap"
            >
              Mark All Read
            </button>
          ) : (
            <div className="w-10" /> /* spacer */
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <p className="text-gray-400 font-medium">No notifications yet</p>
              <p className="text-gray-300 text-sm mt-1">Your notifications will appear here</p>
            </div>
          ) : (
            notifications.map((notification: any) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border-2 overflow-hidden ${
                  !notification.isRead
                    ? 'bg-teal-50 border-teal-200'
                    : 'bg-white border-gray-100'
                }`}
              >
                {/* Main row — tap to view */}
                <button
                  onClick={() => handleView(notification)}
                  className="w-full text-left p-4 flex gap-3 items-start"
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${
                    notification.type === 'Success' ? 'bg-emerald-100 text-emerald-600'
                    : notification.type === 'Error' ? 'bg-rose-100 text-rose-600'
                    : 'bg-teal-100 text-teal-600'
                  }`}>
                    <span>
                      {notification.type === 'Order' || notification.type === 'Payment Confirmed' ? '🛒' : '🔔'}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-bold leading-snug ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <div className="w-2.5 h-2.5 rounded-full bg-teal-500 flex-shrink-0 mt-1 animate-pulse" />
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed line-clamp-2">
                      {notification.message}
                    </p>
                    {(notification.createdAt || notification.timestamp) && (
                      <p className="text-gray-400 text-[11px] mt-1.5">
                        {new Date(notification.createdAt || notification.timestamp).toLocaleDateString('en-IN', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </button>

                {/* Action bar */}
                <div className="px-4 pb-3 pt-1 flex items-center gap-2 border-t border-gray-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); markAsRead(notification._id); }}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  >
                    {!notification.isRead ? '✓ Mark Read' : '◦ Unread'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleView(notification); }}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                  >
                    View →
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
