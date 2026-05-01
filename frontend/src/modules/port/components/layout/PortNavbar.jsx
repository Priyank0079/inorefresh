import React from 'react';
import { useNavigate } from 'react-router-dom';

const PortNavbar = ({ onMenuClick, title }) => {
  const navigate = useNavigate();

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
          <div className="relative">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors relative">
              <span className="material-icons-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200 ml-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-800">Veraval Port</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
            <button 
              onClick={() => navigate('/port/settings/profile')}
              className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm hover:ring-4 hover:ring-teal-50 transition-all"
            >
              VP
            </button>
          </div>

          {/* Logout */}
          <button 
            onClick={() => navigate('/login')}
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
