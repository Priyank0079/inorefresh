import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import PortSidebar from './PortSidebar';
import PortNavbar from './PortNavbar';
import '../../styles/port-global.css';

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
    <div className="h-screen overflow-hidden bg-slate-50 font-sans">
      <PortSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="lg:ml-72 flex flex-col h-screen overflow-hidden relative">
        <PortNavbar 
          onMenuClick={() => setIsSidebarOpen(true)} 
          title={getTitle(location.pathname)} 
        />
        
        <main className="flex-1 px-4 pt-4 pb-32 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        <footer className="hidden lg:block py-6 px-8 border-t border-slate-200 text-center">
          <p className="text-slate-400 text-sm">
            &copy; 2026 Inor Fresh Port Module. Professional Enterprise Admin Panel.
          </p>
        </footer>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-8px_20px_rgba(0,0,0,0.03)] z-40 pb-safe">
          <div className="flex justify-around items-end h-16 px-2 pb-2">
            <Link 
              to="/port" 
              className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${location.pathname === '/port' ? 'text-[#10998c]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span className="material-icons-outlined text-[24px]">{location.pathname === '/port' ? 'dashboard' : 'dashboard'}</span>
              <span className="text-[10px] font-bold tracking-wide">Home</span>
            </Link>
            
            <Link 
              to="/port/products/add" 
              className="relative -top-5 flex flex-col items-center justify-center space-y-1"
            >
              <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-white ring-[6px] ring-slate-50 transition-transform active:scale-95 shadow-xl ${location.pathname === '/port/products/add' ? 'bg-[#0e8a7e]' : 'bg-gradient-to-tr from-[#10998c] to-[#14a596]'}`}>
                <span className="material-icons-outlined text-[28px]">add</span>
              </div>
              <span className={`absolute -bottom-5 text-[10px] font-bold tracking-wide whitespace-nowrap ${location.pathname === '/port/products/add' ? 'text-[#10998c]' : 'text-slate-500'}`}>Add Product</span>
            </Link>

            <Link 
              to="/port/settings/profile" 
              className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${location.pathname === '/port/settings/profile' ? 'text-[#10998c]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span className="material-icons-outlined text-[24px]">{location.pathname === '/port/settings/profile' ? 'person' : 'person_outline'}</span>
              <span className="text-[10px] font-bold tracking-wide">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortLayout;
