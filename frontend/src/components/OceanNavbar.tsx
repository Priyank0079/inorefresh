import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeContext } from '../context/ThemeContext';

export default function OceanNavbar() {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const { activeCategory, setActiveCategory } = useThemeContext();
    const location = useLocation();
    const isHome = location.pathname === '/' || location.pathname === '/user/home';

    useEffect(() => {
        const controlNavbar = () => {
            if (typeof window !== 'undefined') {
                if (window.scrollY > lastScrollY && window.scrollY > 100) {
                    setIsVisible(false); // Scrolling down - hide
                } else {
                    setIsVisible(true); // Scrolling up - show
                }
                setLastScrollY(window.scrollY);
            }
        };

        window.addEventListener('scroll', controlNavbar);
        return () => window.removeEventListener('scroll', controlNavbar);
    }, [lastScrollY]);

    const navLinks = [
        {
            name: 'Home',
            id: 'all',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            )
        },
        {
            name: 'Aqua Fish',
            id: 'aqua',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <path d="M12 12c.5-3 3-3 3-3s0 3-3 3z" />
                    <path d="M16 12l4-4v8l-4-4z" />
                </svg>
            )
        },
        {
            name: 'Marin Fish',
            id: 'marin',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 14c.5-1.5 2-2 2-2s-1.5-.5-2-2" />
                    <path d="M2.5 12S5 5 12 5s9.5 7 9.5 7-2.5 7-9.5 7S2.5 12 2.5 12z" />
                    <circle cx="11.5" cy="12" r="2.5" />
                    <path d="M2 12l-1.5-3V15L2 12z" />
                </svg>
            )
        },
        {
            name: 'Bengali Fish',
            id: 'bengali',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9z" />
                    <path d="M12 12c2-2 5-2 5-2s-3 8-5 8-5-8-5-8 3 0 5 2z" />
                </svg>
            )
        },
    ];

    const handleNavClick = (id: string) => {
        setActiveCategory(id);
        if (isHome) {
            const section = document.getElementById('category-section');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-[100] h-[100px] flex items-center justify-center transition-all duration-500 transform ${isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            <div className="w-full flex items-center justify-center gap-[40px] md:gap-[80px]">
                {navLinks.map((link) => (
                    <button
                        key={link.id}
                        onClick={() => handleNavClick(link.id)}
                        className="flex flex-col items-center justify-center transition-all duration-300 relative group"
                    >
                        <motion.div
                            whileHover={{ y: -6 }}
                            className="flex flex-col items-center justify-center group/item transition-all duration-300"
                        >
                            <div className={`
                                w-[48px] h-[48px] flex items-center justify-center 
                                transition-all duration-300 relative z-10
                                ${activeCategory === link.id ? 'scale-110' : 'opacity-80 group-hover:opacity-100'}
                            `}>
                                {/* Active Aqua Glow Circle */}
                                {activeCategory === link.id && (
                                    <motion.div
                                        layoutId="activeCircle"
                                        className="absolute inset-0 bg-[#6FD3FF]/20 rounded-full blur-[6px]"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}

                                <div className={`
                                    transition-all duration-300
                                    ${activeCategory === link.id ? 'text-[#6FD3FF]' : 'text-[#D6E6F2] group-hover:text-[#6FD3FF]'}
                                `}
                                    style={{
                                        filter: activeCategory === link.id ? 'drop-shadow(0 0 10px rgba(111,211,255,1))' : 'none',
                                    }}
                                >
                                    {link.icon}
                                </div>
                            </div>

                            <span className={`
                                text-[13px] md:text-[14px] font-bold mt-[4px] transition-all duration-300 tracking-[0.05em]
                                ${activeCategory === link.id ? 'text-white' : 'text-[#D6E6F2] group-hover:text-white'}
                            `}
                                style={{
                                    textShadow: activeCategory === link.id ? '0 0 12px rgba(111,211,255,0.8)' : 'none'
                                }}
                            >
                                {link.name}
                            </span>
                        </motion.div>
                    </button>
                ))}
            </div>
        </nav>
    );
}
