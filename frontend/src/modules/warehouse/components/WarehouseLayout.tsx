import { ReactNode, useState, useCallback } from 'react';
import WarehouseHeader from './WarehouseHeader';
import WarehouseSidebar from './WarehouseSidebar';
import { useWarehouseSocket, WarehouseNotification } from '../hooks/useWarehouseSocket';
import WarehouseNotificationAlert from './WarehouseNotificationAlert';
import GlobalBackButton from '../../../components/GlobalBackButton';

interface WarehouseLayoutProps {
  children: ReactNode;
}

export default function WarehouseLayout({ children }: WarehouseLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState<WarehouseNotification | null>(null);

  const handleNotificationReceived = useCallback((notification: WarehouseNotification) => {
    setActiveNotification(notification);
  }, []);

  useWarehouseSocket(handleNotificationReceived);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeNotification = () => {
    setActiveNotification(null);
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
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
        className={`fixed left-0 top-0 h-screen z-50 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <WarehouseSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 w-full ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        {/* Header */}
        <WarehouseHeader onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <GlobalBackButton
          fallbackPath="/warehouse"
          topOffsetClass="top-[112px] sm:top-[96px] md:top-[88px]"
          zIndexClass="z-40"
          theme="light"
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-neutral-50">{children}</main>
      </div>
    </div>
  );
}

