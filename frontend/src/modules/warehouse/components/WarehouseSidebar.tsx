import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";


interface SubMenuItem {
  label: string;
  path: string;
  icon: JSX.Element;
}

interface MenuItem {
  label: string;
  path: string;
  hasSubmenu?: boolean;
  submenuItems?: SubMenuItem[];
  icon?: JSX.Element;
}

interface WarehouseSidebarProps {
  onClose?: () => void;
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", path: "/warehouse" },
  { label: "Orders", path: "/warehouse/orders" },
  { label: "Category", path: "/warehouse/category" },
  {
    label: "Product",
    path: "/warehouse/product",
    hasSubmenu: true,
    submenuItems: [
      {
        label: "Add new Product",
        path: "/warehouse/product/add",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
            <line x1="16" y1="12" x2="8" y2="12"></line>
            <line x1="12" y1="16" x2="12" y2="8"></line>
          </svg>
        ),
      },
      {
        label: "Taxes",
        path: "/warehouse/product/taxes",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            {/* Three stacked coin piles */}
            <ellipse cx="12" cy="18" rx="4" ry="2"></ellipse>
            <ellipse cx="12" cy="14" rx="3.5" ry="1.8"></ellipse>
            <ellipse cx="12" cy="10" rx="3" ry="1.5"></ellipse>
            {/* Percentage sign on top pile */}
            <circle cx="9" cy="9" r="1" fill="currentColor"></circle>
            <line x1="7" y1="7" x2="11" y2="11" strokeWidth="2"></line>
            <circle cx="15" cy="11" r="1" fill="currentColor"></circle>
          </svg>
        ),
      },
      {
        label: "Product List",
        path: "/warehouse/product/list",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            {/* Two checkmarks */}
            <polyline points="9 12 11 14 15 10"></polyline>
            <polyline points="9 16 11 18 15 14"></polyline>
          </svg>
        ),
      },
      {
        label: "Stock Management",
        path: "/warehouse/product/stock",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        ),
      },
    ],
  },
  {
    label: "Inward Stock",
    path: "/warehouse/inward-stock",
    hasSubmenu: true,
    submenuItems: [
      {
        label: "Add Inward Stock",
        path: "/warehouse/inward-stock/add",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        ),
      },
      {
        label: "Inward Stock List",
        path: "/warehouse/inward-stock/list",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        ),
      },
    ],
  },
  {
    label: "Port Shipments",
    path: "/warehouse/port-shipments",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
    ),
  },
  {
    label: "Wallet",
    path: "/warehouse/wallet",
  },
  {
    label: "Reports",
    path: "/warehouse/reports",
    hasSubmenu: true,
    submenuItems: [
      {
        label: "Sales Report",
        path: "/warehouse/reports/sales",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        ),
      },
      {
        label: "Inward Report",
        path: "/warehouse/reports/inward",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        ),
      },
    ],
  },
  {
    label: "Return",
    path: "/warehouse/return",
    hasSubmenu: true,
    submenuItems: [
      {
        label: "Return Inbox",
        path: "/warehouse/return/inbox",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
        ),
      },
      {
        label: "Verify Return",
        path: "/warehouse/return/verify",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        ),
      },
      {
        label: "Refund Information",
        path: "/warehouse/return/refunds",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M3 12h18M3 18h12" /><circle cx="19" cy="18" r="2.5" />
          </svg>
        ),
      },
    ],
  },
  { 
    label: "Explore", 
    path: "/warehouse/explore",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.35-4.35"></path>
      </svg>
    ),
  },
];

export default function WarehouseSidebar({ onClose }: WarehouseSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const items = [...menuItems];

  const isActive = (path: string) => {
    if (path === "/warehouse") {
      return (
        location.pathname === "/warehouse" || location.pathname === "/warehouse/"
      );
    }
    return location.pathname.startsWith(path);
  };

  const isSubmenuActive = (submenuItems?: SubMenuItem[]) => {
    if (!submenuItems) return false;
    return submenuItems.some(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path + "/")
    );
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  const toggleMenu = (path: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const isExpanded = (path: string) => {
    return (
      expandedMenus.has(path) ||
      isSubmenuActive(
        items.find((item) => item.path === path)?.submenuItems
      )
    );
  };

  return (
    <aside className="w-64 bg-teal-700 h-screen flex flex-col overflow-hidden">
      {/* Close button - only show on mobile */}
      <div className="flex justify-end p-4 border-b border-teal-600 lg:hidden">
        <button
          onClick={onClose}
          className="p-2 text-teal-100 hover:text-white transition-colors"
          aria-label="Close menu">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <nav className="flex-1 py-4 sm:py-6 overflow-y-auto scrollbar-hide overscroll-contain">
        <ul className="space-y-1 px-2 sm:px-4">
          {items.map((item) => {
            const expanded = isExpanded(item.path);
            const active =
              isActive(item.path) || isSubmenuActive(item.submenuItems);

            return (
              <li key={item.path}>
                <button
                  onClick={() => {
                    if (item.hasSubmenu && item.submenuItems) {
                      toggleMenu(item.path);
                    } else {
                      handleNavigation(item.path);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-colors ${active
                    ? "bg-teal-600 text-white"
                    : "text-teal-100 hover:bg-teal-600/50 hover:text-white"
                    }`}>
                  <div className="flex items-center gap-2">
                    {item.icon && (
                      <span className="flex-shrink-0">{item.icon}</span>
                    )}
                    <span className="text-xs sm:text-sm font-medium">
                      {item.label}
                    </span>
                  </div>
                  {item.hasSubmenu && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`transition-transform ${expanded ? "rotate-180" : ""
                        } ${active ? "text-white" : "text-teal-200"}`}>
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                {item.hasSubmenu && item.submenuItems && expanded && (
                  <ul className="mt-1 space-y-1 ml-4">
                    {item.submenuItems.map((subItem) => {
                      const subActive =
                        location.pathname === subItem.path ||
                        location.pathname.startsWith(subItem.path + "/");
                      return (
                        <li key={subItem.path}>
                          <button
                            onClick={() => handleNavigation(subItem.path)}
                            className={`w-full flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-left transition-colors ${subActive
                              ? "bg-teal-500 text-white"
                              : "text-teal-100 hover:bg-teal-600/50 hover:text-white"
                              }`}>
                            <span className="flex-shrink-0">
                              {subItem.icon}
                            </span>
                            <span className="text-xs sm:text-sm font-medium">
                              {subItem.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
