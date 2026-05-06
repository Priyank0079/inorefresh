import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

const PortNavbar = ({ onMenuClick, title }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/port/login', { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n) => {
    markAsRead(n._id);
    if (n.link) navigate(n.link);
    setShowNotifications(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
          >
            <span className="material-icons-outlined">menu</span>
          </button>
          <h2 className="text-lg font-semibold text-slate-800">{title || 'Dashboard'}</h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Global Search */}
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors hidden sm:block">
            <span className="material-icons-outlined">search</span>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors relative"
            >
              <span className="material-icons-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[8px] flex items-center justify-center rounded-full font-bold border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 flex flex-col">
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold text-teal-600 hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-12 px-4 text-center">
                      <p className="text-xs text-slate-400">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex gap-3 ${!n.isRead ? 'bg-teal-50/30' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          n.type === 'Success' ? 'bg-emerald-100 text-emerald-600' :
                          n.type === 'Error' ? 'bg-rose-100 text-rose-600' :
                          'bg-teal-100 text-teal-600'
                        }`}>
                          <span className="material-icons-outlined text-sm">
                            {n.type === 'Order' ? 'shopping_bag' : 'notifications'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold text-slate-800 truncate ${!n.isRead ? 'font-black' : ''}`}>{n.title}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                          <p className="text-[9px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200 ml-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-800">{user?.name || 'Veraval Port'}</p>
              <p className="text-xs text-slate-500">{user?.userType || 'Administrator'}</p>
            </div>
            <button 
              onClick={() => navigate('/port/settings/profile')}
              className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm hover:ring-4 hover:ring-teal-50 transition-all"
            >
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'VP'}
            </button>
          </div>

          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Logout"
          >
            <span className="material-icons-outlined">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default PortNavbar;
