import { useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useEffect } from 'react';

const typeConfig: Record<string, { emoji: string; bg: string; border: string; text: string }> = {
  Order:              { emoji: '🛒', bg: 'bg-teal-50',    border: 'border-teal-100',   text: 'text-teal-600'   },
  'Payment Confirmed':{ emoji: '💳', bg: 'bg-green-50',   border: 'border-green-100',  text: 'text-green-600'  },
  Payment:            { emoji: '💳', bg: 'bg-green-50',   border: 'border-green-100',  text: 'text-green-600'  },
  Delivery:           { emoji: '🚚', bg: 'bg-blue-50',    border: 'border-blue-100',   text: 'text-blue-600'   },
  Success:            { emoji: '✅', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600'},
  Error:              { emoji: '❌', bg: 'bg-rose-50',    border: 'border-rose-100',   text: 'text-rose-600'   },
  Warning:            { emoji: '⚠️', bg: 'bg-amber-50',   border: 'border-amber-100',  text: 'text-amber-600'  },
  System:             { emoji: '⚙️', bg: 'bg-gray-50',    border: 'border-gray-100',   text: 'text-gray-500'   },
  Info:               { emoji: '🔔', bg: 'bg-teal-50',    border: 'border-teal-100',   text: 'text-teal-600'   },
};

export default function NotificationDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { markAsRead } = useNotifications();

  // Notification is passed via router state from the notifications list
  const notification = location.state?.notification as any;

  // Mark as read when the page opens
  useEffect(() => {
    if (notification?._id && !notification?.isRead) {
      markAsRead(notification._id);
    }
  }, [notification?._id]);

  // If no notification data was passed, go back
  if (!notification) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <p className="text-gray-400 font-medium mb-4">Notification not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  const cfg = typeConfig[notification.type] || typeConfig['Info'];
  const formattedDate = notification.createdAt
    ? new Date(notification.createdAt).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : notification.timestamp
    ? new Date(notification.timestamp).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-teal-600 to-teal-700 pb-5 pt-5 px-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
            aria-label="Back"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18L9 12L15 6" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Notification Details</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Icon + Title card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
                {cfg.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    {notification.type}
                  </span>
                  {!notification.isRead && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-600 text-white">
                      New
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-gray-900 leading-snug">{notification.title}</h2>
                {formattedDate && (
                  <p className="text-xs text-gray-400 mt-1 font-medium">{formattedDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Full message card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Message</p>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{notification.message}</p>
          </div>

          {/* Action button if notification has a link */}
          {notification.link && (
            <button
              onClick={() => navigate(notification.link)}
              className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              View Details
            </button>
          )}

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            ← Back to Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
