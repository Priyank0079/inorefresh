import { useState, useCallback, ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import GlobalBackButton from '../../../components/GlobalBackButton';
import { useAdminSocket } from '../hooks/useAdminSocket';
import RealtimeAlertPopup, { RealtimeAlert } from '../../../components/RealtimeAlertPopup';
import { AdminPermissionProvider, useAdminPermission } from '../../../context/AdminPermissionContext';

interface AdminLayoutProps {
  children: ReactNode;
}

function ReadOnlyBanner() {
  const { isInvestor, isStaff, role } = useAdminPermission();

  if (!isInvestor && !isStaff) return null;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 text-xs font-medium ${
      isInvestor
        ? 'bg-violet-50 border-b border-violet-200 text-violet-700'
        : 'bg-amber-50 border-b border-amber-200 text-amber-700'
    }`}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {isInvestor ? (
          <>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </>
        )}
      </svg>
      {isInvestor
        ? 'Investor access — you can view all data but cannot make changes'
        : `Staff access — some actions may be restricted based on your permissions`}
      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold border ${
        isInvestor
          ? 'bg-violet-100 text-violet-700 border-violet-200'
          : 'bg-amber-100 text-amber-700 border-amber-200'
      }`}>
        {role}
      </span>
    </div>
  );
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [alert, setAlert] = useState<RealtimeAlert | null>(null);

  const handleAlert = useCallback((a: { title: string; message: string }) => setAlert(a), []);

  useAdminSocket(undefined, handleAlert);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <RealtimeAlertPopup alert={alert} onClose={() => setAlert(null)} accent="bg-indigo-600" />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div
        className={`fixed left-0 top-0 h-screen z-50 transition-transform duration-300 ease-in-out w-64 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className={`flex-1 flex flex-col transition-all duration-300 w-full ${
        isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
      }`}>
        <AdminHeader onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <ReadOnlyBanner />
        <GlobalBackButton
          fallbackPath="/admin"
          topOffsetClass="top-[112px] sm:top-[96px] md:top-[88px]"
          zIndexClass="z-40"
          theme="light"
        />

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

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminPermissionProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminPermissionProvider>
  );
}
