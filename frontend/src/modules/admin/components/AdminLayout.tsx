import { useState, useCallback, ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import GlobalBackButton from '../../../components/GlobalBackButton';
import { useAdminSocket } from '../hooks/useAdminSocket';
import RealtimeAlertPopup, { RealtimeAlert } from '../../../components/RealtimeAlertPopup';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to open on desktop
  const [alert, setAlert] = useState<RealtimeAlert | null>(null);

  const handleAlert = useCallback((a: { title: string; message: string }) => setAlert(a), []);

  // Initialize admin socket for real-time notifications (popup + sound)
  useAdminSocket(undefined, handleAlert);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Real-time popup + sound for new orders / payments / port offers */}
      <RealtimeAlertPopup alert={alert} onClose={() => setAlert(null)} accent="bg-indigo-600" />

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - Fixed */}
      <div
        className={`fixed left-0 top-0 h-screen z-50 transition-transform duration-300 ease-in-out w-64 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 w-full ${
        isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
      }`}>
        {/* Header */}
        <AdminHeader onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <GlobalBackButton
          fallbackPath="/admin"
          topOffsetClass="top-[112px] sm:top-[96px] md:top-[88px]"
          zIndexClass="z-40"
          theme="light"
        />

        {/* Page Content */}
        <main 
          className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-neutral-50"
          data-lenis-prevent
          style={{ touchAction: 'pan-y' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

