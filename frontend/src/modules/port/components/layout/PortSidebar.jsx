import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const menuSections = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", path: "/port", icon: "dashboard" }
    ]
  },
  {
    title: "REQUIREMENT SECTION",
    items: [
      { label: "Incoming Requirements", path: "/port/requirements", icon: "inbox" },
      { label: "Requirement History", path: "/port/requirements/history", icon: "history" }
    ]
  },
  {
    title: "OFFER SECTION",
    items: [
      { label: "My Offers", path: "/port/offers", icon: "local_offer" },
      { label: "Negotiations", path: "/port/offers/negotiations", icon: "handshake" }
    ]
  },
  {
    title: "PRODUCT SECTION",
    items: [
      { label: "My Products", path: "/port/products", icon: "inventory_2" },
      { label: "Add Product", path: "/port/products/add", icon: "add_box" }
    ]
  },
  {
    title: "ORDER SECTION",
    items: [
      { label: "My Orders", path: "/port/orders", icon: "shopping_cart" },
      { label: "Port Shipment", path: "/port/shipments", icon: "local_shipping" }
    ]
  },
  {
    title: "NOTIFICATION SECTION",
    items: [
      { label: "Notifications", path: "/port/notifications", icon: "notifications" }
    ]
  },
  {
    title: "SETTINGS",
    items: [
      { label: "Profile Settings", path: "/port/settings/profile", icon: "person" }
    ]
  }
];

const PortSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const Icon = ({ name }) => {
    // Simplified icons for now, can be replaced with Lucide or SVG
    return <span className="material-icons-outlined text-[18px]">{name}</span>;
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-[100dvh] w-[290px] lg:w-72 bg-gradient-to-b from-[#14a596] via-[#10998c] to-[#0f8a80] text-white transition-transform duration-300 z-50 flex flex-col overflow-hidden shadow-2xl shadow-teal-900/20 border-r border-white/10 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 sm:py-5 border-b border-white/10 flex-shrink-0 bg-[#10998c]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <img src="/assets/Inor fresh.png" alt="Logo" className="h-6 w-6 brightness-0 invert" />
          </div>
          <div className="min-w-0">
            <span className="block font-extrabold text-[15px] sm:text-lg tracking-[0.18em] leading-none">PORT HUB</span>
            <span className="block text-[9px] sm:text-[10px] uppercase tracking-[0.35em] text-white/60 mt-1">Port Module</span>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white rounded-xl hover:bg-white/10 p-2 transition-colors">
          <span className="material-icons-outlined text-[22px]">close</span>
        </button>
      </div>

      <nav className="port-sidebar-nav flex-1 min-h-0 px-2.5 py-2.5 sm:py-3 space-y-3 sm:space-y-4 overflow-y-auto overscroll-contain">
        {menuSections.map((section, idx) => (
          <div key={idx} className="rounded-2xl">
            <h3 className="px-3 mb-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.3em] text-white/45">
              {section.title}
            </h3>
            <ul className="space-y-0.5 sm:space-y-1">
              {section.items.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      navigate(item.path);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`group w-full flex items-center gap-2.5 px-3.5 py-2 sm:py-2.5 rounded-2xl text-[13px] sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap overflow-hidden ${
                      isActive(item.path)
                        ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-xl shrink-0 transition-colors ${
                      isActive(item.path) ? 'bg-white/10' : 'bg-white/5 group-hover:bg-white/10'
                    }`}>
                      <Icon name={item.icon} />
                    </span>
                    <span className="truncate">{item.label}</span>
                    {isActive(item.path) && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.12)]" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default PortSidebar;
