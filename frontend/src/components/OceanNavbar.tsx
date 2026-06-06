import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeContext } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useLocation as useLocationContext } from '../hooks/useLocation';
import { useCart } from '../context/CartContext';

interface OceanNavbarProps {
    onMenuClick: () => void;
}

const FILTER_OPTIONS = [
    { value: 0, label: 'All Time', short: 'All' },
    { value: 1, label: 'Today',    short: 'Today' },
    { value: 2, label: 'Last 2 Days', short: '2D' },
    { value: 3, label: 'Last 3 Days', short: '3D' },
    { value: 5, label: 'Last 5 Days', short: '5D' },
    { value: 7, label: 'Last 7 Days', short: '7D' },
    { value: 10, label: 'Last 10 Days', short: '10D' },
];

export default function OceanNavbar({ onMenuClick }: OceanNavbarProps) {
    const internalNavigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const lastScrollYRef = useRef(0);
    const { activeCategory, setActiveCategory, dateFilter, setDateFilter } = useThemeContext();
    const routerLocation = useLocation();
    const isHome = routerLocation.pathname === '/' || routerLocation.pathname === '/user/home';
    const isCategorySection = routerLocation.pathname === '/categories' || routerLocation.pathname.startsWith('/category/');
    const { unreadCount } = useNotifications();
    const { logout, isAuthenticated } = useAuth();
    const { isLocationEnabled } = useLocationContext();
    const { cart } = useCart();

    const cartItemsCount = Array.isArray(cart) ? cart.reduce((total, item) => total + (item.quantity || 1), 0) : 0;

    // Hide/show navbar on scroll
    useEffect(() => {
        const controlNavbar = () => {
            const current = window.scrollY;
            if (current > lastScrollYRef.current && current > 100) {
                setIsVisible(false);
                setFilterOpen(false);
            } else {
                setIsVisible(true);
            }
            lastScrollYRef.current = current;
        };
        window.addEventListener('scroll', controlNavbar, { passive: true });
        return () => window.removeEventListener('scroll', controlNavbar);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const isDark = isHome || isCategorySection;

    const navSurfaceClass = isDark
        ? 'bg-gradient-to-b from-[#0C4A69]/95 via-[#0E5D82]/92 to-[#0B4F71]/88 border-b border-white/20 shadow-[0_12px_32px_rgba(5,30,45,0.35)]'
        : 'bg-gradient-to-b from-[#D8F5FF]/96 via-[#BEEFFF]/92 to-[#9DE7FF]/85 border-b border-[#4AAFD1]/25 shadow-[0_10px_26px_rgba(17,111,146,0.16)]';

    const iconColorClass = isDark
        ? 'text-white/80 hover:text-white hover:bg-white/10'
        : 'text-[#072F4A]/70 hover:text-[#072F4A] hover:bg-[#072F4A]/8';

    const activeOption = FILTER_OPTIONS.find(o => o.value === dateFilter) ?? FILTER_OPTIONS[0];
    const isFiltered = dateFilter !== 0;

    const handleLogout = () => {
        logout();
        internalNavigate('/login');
    };

    const handleSelect = (value: number) => {
        setDateFilter(value === dateFilter ? 0 : value);
        setFilterOpen(false);
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-[100] h-[52px] flex items-center px-3 transition-all duration-500 transform ${
                isVisible ? 'translate-y-0' : '-translate-y-full'
            }`}
        >
            {/* Route-aware nav surface */}
            <div className={`absolute inset-0 ${navSurfaceClass} backdrop-blur-[12px] shadow-lg`} />

            <div className="relative w-full flex items-center justify-between z-10 h-full gap-1.5">

                {/* ── Left: Compact Date Filter ── */}
                <div ref={filterRef} className="flex-shrink-0 flex items-center relative">
                    {/* Trigger button */}
                    <button
                        id="navbar-date-filter-btn"
                        onClick={() => setFilterOpen(p => !p)}
                        aria-expanded={filterOpen}
                        aria-label="Date filter"
                        className={`
                            flex items-center gap-1 pl-2 pr-1.5 py-1 rounded-lg
                            text-[10px] font-bold tracking-wide transition-all duration-200
                            border active:scale-95
                            ${isDark
                                ? isFiltered
                                    ? 'bg-[#8BE7FF] text-[#072F4A] border-[#8BE7FF] shadow-[0_0_14px_rgba(139,231,255,0.45)]'
                                    : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/18'
                                : isFiltered
                                    ? 'bg-[#1CA7C7] text-white border-[#1CA7C7] shadow-[0_2px_10px_rgba(28,167,199,0.35)]'
                                    : 'bg-[#1CA7C7]/10 text-[#072F4A] border-[#1CA7C7]/30 hover:bg-[#1CA7C7]/20'
                            }
                        `}
                    >
                        {/* Calendar icon */}
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>{activeOption.short}</span>
                        {/* Chevron */}
                        <svg
                            width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                            className={`transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`}
                        >
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>

                    {/* Active dot indicator */}
                    {isFiltered && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#FF6B6B] border border-white/40 shadow-sm" />
                    )}

                    {/* ── Dropdown Panel ── */}
                    <AnimatePresence>
                        {filterOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className="absolute top-[calc(100%+8px)] left-0 w-[200px] rounded-2xl overflow-hidden z-50"
                                style={{
                                    background: isDark
                                        ? 'linear-gradient(145deg, rgba(8,52,80,0.97) 0%, rgba(11,63,96,0.97) 100%)'
                                        : 'linear-gradient(145deg, rgba(216,245,255,0.98) 0%, rgba(158,231,255,0.98) 100%)',
                                    border: isDark ? '1px solid rgba(139,231,255,0.15)' : '1px solid rgba(28,167,199,0.25)',
                                    boxShadow: isDark
                                        ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,231,255,0.08)'
                                        : '0 16px 48px rgba(17,111,146,0.22), 0 0 0 1px rgba(28,167,199,0.12)',
                                    backdropFilter: 'blur(20px)',
                                }}
                            >
                                {/* Panel header */}
                                <div className={`px-3 pt-2.5 pb-1.5 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-[#1CA7C7]/15'}`}>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#8BE7FF]' : 'text-[#0E5D82]'}`}>
                                        Filter by Date
                                    </span>
                                    {isFiltered && (
                                        <button
                                            onClick={() => { setDateFilter(0); setFilterOpen(false); }}
                                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md transition-all ${isDark ? 'text-[#8BE7FF]/70 hover:text-[#8BE7FF] hover:bg-white/10' : 'text-[#1CA7C7] hover:bg-[#1CA7C7]/10'}`}
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                {/* Options grid */}
                                <div className="p-2 grid grid-cols-2 gap-1.5">
                                    {FILTER_OPTIONS.map(opt => {
                                        const isActive = dateFilter === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleSelect(opt.value)}
                                                className={`
                                                    relative flex flex-col items-start px-2.5 py-1.5 rounded-xl text-left transition-all duration-150 active:scale-[0.97]
                                                    ${isActive
                                                        ? isDark
                                                            ? 'bg-[#8BE7FF] text-[#072F4A] shadow-[0_4px_14px_rgba(139,231,255,0.35)]'
                                                            : 'bg-[#1CA7C7] text-white shadow-[0_4px_14px_rgba(28,167,199,0.40)]'
                                                        : isDark
                                                            ? 'bg-white/6 text-white/80 hover:bg-white/12 hover:text-white border border-white/8 hover:border-white/20'
                                                            : 'bg-[#1CA7C7]/8 text-[#072F4A]/80 hover:bg-[#1CA7C7]/18 hover:text-[#072F4A] border border-[#1CA7C7]/15 hover:border-[#1CA7C7]/30'
                                                    }
                                                `}
                                            >
                                                <span className="text-[11px] font-black leading-none">
                                                    {opt.short}
                                                </span>
                                                <span className="text-[8px] font-medium mt-0.5 leading-none opacity-75">
                                                    {opt.label}
                                                </span>
                                                {isActive && (
                                                    <span className="absolute top-1 right-1">
                                                        <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                                        </svg>
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Center: Brand ── */}
                <div
                    className="cursor-pointer group flex flex-col items-center flex-1 justify-center"
                    onClick={() => {
                        setActiveCategory('all');
                        internalNavigate('/');
                    }}
                >
                    <span className={`
                        text-[17px] sm:text-xl font-black tracking-[-0.04em] transition-all duration-300 leading-none
                        ${isDark ? 'text-white' : 'text-[#072F4A]'}
                    `}>
                        INOR<span className={isDark ? 'text-[#8BE7FF]' : 'text-[#1CA7C7]'}>FRESH</span>
                    </span>
                    <div className={`h-[2px] w-0 group-hover:w-full transition-all duration-300 rounded-full mt-0.5 ${isDark ? 'bg-[#8BE7FF]' : 'bg-[#1CA7C7]'}`} />
                </div>

                {/* ── Right: Action Icons ── */}
                <div className="flex-shrink-0 flex items-center justify-end gap-0">

                    {/* Cart */}
                    <button
                        id="navbar-cart-btn"
                        onClick={() => internalNavigate('/cart')}
                        className={`relative p-1.5 rounded-lg transition-all duration-200 active:scale-90 ${iconColorClass}`}
                        aria-label="Cart"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        {cartItemsCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md"
                            >
                                {cartItemsCount > 99 ? '99+' : cartItemsCount}
                            </motion.span>
                        )}
                    </button>

                    {/* Notifications — only outside home */}
                    {!isHome && (
                        <button
                            id="navbar-notifications-btn"
                            onClick={() => internalNavigate('/account')}
                            className={`relative p-1.5 rounded-lg transition-all duration-200 active:scale-90 ${iconColorClass}`}
                            aria-label="Notifications"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {unreadCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none shadow-md"
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </motion.span>
                            )}
                        </button>
                    )}

                    {/* Account / Settings */}
                    <button
                        id="navbar-account-btn"
                        onClick={() => internalNavigate('/account')}
                        className={`p-1.5 rounded-lg transition-all duration-200 active:scale-90 ${iconColorClass}`}
                        aria-label="Account"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </button>

                    {/* Logout */}
                    {isAuthenticated && (
                        <button
                            id="navbar-logout-btn"
                            onClick={handleLogout}
                            className={`p-1.5 rounded-lg transition-all duration-200 active:scale-90 ${iconColorClass}`}
                            aria-label="Logout"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
