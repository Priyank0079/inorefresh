import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PortSidebar from './PortSidebar';
import PortNavbar from './PortNavbar';

const PortLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Map paths to titles for the navbar
  const getTitle = (path) => {
    if (path.includes('/requirements')) return 'Requirements';
    if (path.includes('/offers')) return 'My Offers';
    if (path.includes('/products')) return 'My Products';
    if (path.includes('/orders')) return 'My Orders';
    if (path.includes('/notifications')) return 'Notifications';
    if (path.includes('/settings')) return 'Settings';
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <PortSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="lg:ml-64 flex flex-col min-h-screen">
        <PortNavbar 
          onMenuClick={() => setIsSidebarOpen(true)} 
          title={getTitle(location.pathname)} 
        />
        
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        <footer className="py-6 px-8 border-t border-slate-200 text-center">
          <p className="text-slate-400 text-sm">
            &copy; 2024 Inor Fresh Port Module. Professional Enterprise Admin Panel.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PortLayout;
