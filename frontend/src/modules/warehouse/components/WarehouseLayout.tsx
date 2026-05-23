import { ReactNode, useState, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();

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
    <div className="flex h-[100dvh] overflow-hidden bg-neutral-50 relative">
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
      <div className="flex-1 min-w-0 flex flex-col h-[100dvh] transition-all duration-300 w-full lg:ml-64 relative">
        {/* Header */}
        <WarehouseHeader onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 pt-3 pb-28 sm:px-4 sm:pt-4 lg:p-6 bg-neutral-50 touch-pan-y overscroll-contain">
          <div className="min-h-full">
            {children}
          </div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-[0_-8px_20px_rgba(0,0,0,0.03)] z-40 pb-safe">
          <div className="flex justify-around items-end h-16 px-2 pb-2">
            <Link 
              to="/warehouse" 
              className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${location.pathname === '/warehouse' || location.pathname === '/warehouse/' ? 'text-[#0f766e]' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              <span className="material-icons-outlined text-[24px]">{location.pathname === '/warehouse' || location.pathname === '/warehouse/' ? 'dashboard' : 'dashboard'}</span>
              <span className="text-[10px] font-bold tracking-wide">Home</span>
            </Link>
            
            <Link 
              to="/warehouse/product/add" 
              className="relative -top-5 flex flex-col items-center justify-center space-y-1"
            >
              <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-white ring-[6px] ring-neutral-50 transition-transform active:scale-95 shadow-xl ${location.pathname === '/warehouse/product/add' ? 'bg-[#115e59]' : 'bg-gradient-to-tr from-[#0f766e] to-[#14b8a6]'}`}>
                <span className="material-icons-outlined text-[28px]">add</span>
              </div>
              <span className={`absolute -bottom-5 text-[10px] font-bold tracking-wide whitespace-nowrap ${location.pathname === '/warehouse/product/add' ? 'text-[#0f766e]' : 'text-neutral-500'}`}>Add Product</span>
            </Link>

            <Link 
              to="/warehouse/account-settings" 
              className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${location.pathname.toLowerCase().includes('/account-settings') ? 'text-[#0f766e]' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              <span className="material-icons-outlined text-[24px]">{location.pathname.toLowerCase().includes('/account-settings') ? 'person' : 'person_outline'}</span>
              <span className="text-[10px] font-bold tracking-wide">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

