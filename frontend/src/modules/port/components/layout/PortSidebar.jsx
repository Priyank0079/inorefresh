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
      { label: "Order Tracking", path: "/port/orders/track", icon: "local_shipping" }
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
      { label: "Profile Settings", path: "/port/settings/profile", icon: "person" },
      { label: "Account Settings", path: "/port/settings/account", icon: "settings" }
    ]
  }
];

const PortSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const Icon = ({ name }) => {
    // Simplified icons for now, can be replaced with Lucide or SVG
    return <span className="material-icons-outlined text-[20px]">{name}</span>;
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-full w-64 bg-[#0D9488] text-white transition-transform duration-300 z-50 overflow-y-auto ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/assets/Inor fresh.png" alt="Logo" className="h-8 brightness-0 invert" />
          <span className="font-bold text-xl tracking-tight">PORT HUB</span>
        </div>
        <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white">
          <span className="material-icons-outlined">close</span>
        </button>
      </div>

      <nav className="p-4 space-y-8">
        {menuSections.map((section, idx) => (
          <div key={idx}>
            <h3 className="px-4 mb-3 text-[11px] font-bold uppercase tracking-[2px] text-white/40">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      navigate(item.path);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-white/15 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
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
