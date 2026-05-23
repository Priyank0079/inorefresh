import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useThemeContext } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useLocation as useLocationContext } from '../hooks/useLocation';

interface OceanNavbarProps {
    onMenuClick: () => void;
}

export default function OceanNavbar({ onMenuClick }: OceanNavbarProps) {
    const internalNavigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const { activeCategory, setActiveCategory, dateFilter, setDateFilter } = useThemeContext();
    const routerLocation = useLocation();
    const isHome = routerLocation.pathname === '/' || routerLocation.pathname === '/user/home';
    const isCategorySection = routerLocation.pathname === '/categories' || routerLocation.pathname.startsWith('/category/');
    const { unreadCount } = useNotifications();
    const { logout, isAuthenticated } = useAuth();
    const { isLocationEnabled } = useLocationContext();

    useEffect(() => {
        const controlNavbar = () => {
            if (typeof window !== 'undefined') {
                if (window.scrollY > lastScrollY && window.scrollY > 100) {
                    setIsVisible(false);
                } else {
                    setIsVisible(true);
                }
                setLastScrollY(window.scrollY);
            }
        };

        window.addEventListener('scroll', controlNavbar);
        return () => window.removeEventListener('scroll', controlNavbar);
    }, [lastScrollY]);

    const navSurfaceClass = isHome
        ? 'bg-gradient-to-b from-[#0C4A69]/95 via-[#0E5D82]/92 to-[#0B4F71]/88 border-b border-white/20 shadow-[0_12px_32px_rgba(5,30,45,0.35)]'
        : isCategorySection
            ? 'bg-gradient-to-b from-[#0C4A69]/95 via-[#0E5D82]/92 to-[#0B4F71]/88 border-b border-white/20 shadow-[0_12px_32px_rgba(5,30,45,0.35)]'
            : 'bg-gradient-to-b from-[#D8F5FF]/96 via-[#BEEFFF]/92 to-[#9DE7FF]/85 border-b border-[#4AAFD1]/25 shadow-[0_10px_26px_rgba(17,111,146,0.16)]';

    // Adaptive icon color depending on background (dark on home, light on other pages)
    const iconColorClass = isHome || isCategorySection
        ? 'text-white/80 hover:text-white hover:bg-white/10'
        : 'text-[#072F4A]/70 hover:text-[#072F4A] hover:bg-[#072F4A]/8';



    const handleLogout = () => {
        logout();
        internalNavigate('/login');
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-[100] h-[70px] flex items-center px-4 transition-all duration-500 transform ${
                isVisible ? 'translate-y-0' : '-translate-y-full'
            }`}
        >
            {/* Route-aware nav surface */}
            <div className={`absolute inset-0 ${navSurfaceClass} backdrop-blur-[12px] shadow-lg`} />

            <div className="relative w-full flex items-center justify-between z-10 h-full gap-2">

                {/* Left side - Date Filter Pills (Scrollable) */}
                <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide py-2 max-w-[38%] md:max-w-[35%] gap-2 mask-linear-right">
                    {[...Array(11)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setDateFilter(dateFilter === i ? 0 : i)}
                            className={`
                                flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap
                                ${dateFilter === i
                                    ? 'bg-[#8BE7FF] text-[#072F4A] border-[#8BE7FF] shadow-[0_0_15px_rgba(139,231,255,0.4)] scale-105'
                                    : (isHome || isCategorySection
                                        ? 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
                                        : 'bg-[#1CA7C7]/10 text-[#072F4A] border-[#1CA7C7]/20 hover:bg-[#1CA7C7]/20')}
                                ${i === 0 && dateFilter !== 0 ? 'hidden' : ''}
                            `}
                        >
                            {i === 0 ? 'All' : i === 1 ? 'Today' : `Last ${i} Days`}
                        </button>
                    ))}
                </div>

                {/* Center - Brand Name */}
                <div
                    className="cursor-pointer group flex flex-col items-center flex-shrink-0 px-2"
                    onClick={() => {
                        setActiveCategory('all');
                        internalNavigate('/');
                    }}
                >
                    <span className={`
                        text-xl md:text-2xl font-black tracking-[-0.05em] transition-all duration-300
                        ${isHome || isCategorySection ? 'text-white' : 'text-[#072F4A]'}
                    `}>
                        INOR<span className={isHome || isCategorySection ? 'text-[#8BE7FF]' : 'text-[#1CA7C7]'}>FRESH</span>
                    </span>
                    <div className={`h-0.5 w-0 group-hover:w-full transition-all duration-300 rounded-full ${isHome || isCategorySection ? 'bg-[#8BE7FF]' : 'bg-[#1CA7C7]'}`} />
                </div>

                {/* Right side - Action Icon Row */}
                <div className="flex-1 flex items-center justify-end gap-0.5">

                    {/* 🔔 Notifications */}
                    {!isHome && (
                        <button
                            id="navbar-notifications-btn"
                            onClick={() => internalNavigate('/account')}
                            className={`relative p-2 rounded-xl transition-all duration-200 active:scale-90 ${iconColorClass}`}
                            aria-label="Notifications"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {unreadCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none shadow-md"
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </motion.span>
                            )}
                        </button>
                    )}

                    {/* ⚙️ Settings / Account */}
                    <button
                        id="navbar-account-btn"
                        onClick={() => internalNavigate('/account')}
                        className={`p-2 rounded-xl transition-all duration-200 active:scale-90 ${iconColorClass}`}
                        aria-label="Account"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </button>



                    {/* 🚪 Logout (only when authenticated) */}
                    {isAuthenticated && (
                        <button
                            id="navbar-logout-btn"
                            onClick={handleLogout}
                            className={`p-2 rounded-xl transition-all duration-200 active:scale-90 ${iconColorClass}`}
                            aria-label="Logout"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
