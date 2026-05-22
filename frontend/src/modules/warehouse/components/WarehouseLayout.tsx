import { ReactNode, useState, useCallback, useEffect } from 'react';
import WarehouseHeader from './WarehouseHeader';
import WarehouseSidebar from './WarehouseSidebar';
import { useWarehouseSocket, WarehouseNotification } from '../hooks/useWarehouseSocket';
import WarehouseNotificationAlert from './WarehouseNotificationAlert';
import GlobalBackButton from '../../../components/GlobalBackButton';
import { useAuth } from '../../../context/AuthContext';
import { registerFCMToken } from '../../../services/pushNotificationService';

interface WarehouseLayoutProps {
  children: ReactNode;
}

export default function WarehouseLayout({ children }: WarehouseLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState<WarehouseNotification | null>(null);
  const { isAuthenticated, user } = useAuth();

  const handleNotificationReceived = useCallback((notification: WarehouseNotification) => {
    setActiveNotification(notification);
  }, []);

  useWarehouseSocket(handleNotificationReceived);

  // ── Register FCM push-notification token for this warehouse ────────────
  useEffect(() => {
    if (!isAuthenticated || user?.userType !== 'Warehouse' || !user?.id) return;

    const userId = String(user.id);
    const savedUserId = localStorage.getItem('fcm_token_user_id');
    const forceUpdate = savedUserId !== userId;

    registerFCMToken(forceUpdate)
      .then((token) => {
        if (token) {
          localStorage.setItem('fcm_token_user_id', userId);
          console.log('📲 FCM token registered for warehouse:', userId);
        }
      })
      .catch((err) => console.warn('⚠️ Warehouse FCM token registration failed:', err));
  }, [isAuthenticated, user?.id, user?.userType]);
  // ────────────────────────────────────────────────────────────────────────

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeNotification = () => {
    setActiveNotification(null);
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-neutral-50">
      {/* Real-time Notification Alert */}
      <WarehouseNotificationAlert
        notification={activeNotification}
        onClose={closeNotification}
      />

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - Fixed */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <WarehouseSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col h-[100dvh] transition-all duration-300 w-full lg:ml-64">
        {/* Header */}
        <WarehouseHeader onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 bg-neutral-50 pb-24 sm:pb-6 touch-pan-y overscroll-contain">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

