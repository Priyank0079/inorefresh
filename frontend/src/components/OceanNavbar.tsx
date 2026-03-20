import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useThemeContext } from '../context/ThemeContext';
import { getHeaderCategoriesPublic } from '../services/api/headerCategoryService';

export default function OceanNavbar() {
    const internalNavigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [categories, setCategories] = useState<any[]>([]);
    const { activeCategory, setActiveCategory } = useThemeContext();
    const routerLocation = useLocation();
    const isHome = routerLocation.pathname === '/' || routerLocation.pathname === '/user/home';
    const isCategorySection = routerLocation.pathname === '/categories' || routerLocation.pathname.startsWith('/category/');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getHeaderCategoriesPublic();
                if (data && Array.isArray(data)) {
                    // Filter for Published status to be extra safe
                    const published = data.filter((cat: any) => cat.status === 'Published');
                    setCategories(published);
                }
            } catch (error) {
                console.error("Error fetching header categories:", error);
            }
        };
        fetchCategories();
    }, []);

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

    const getIcon = (name: string, id: string) => {
        const lowerName = name.toLowerCase();

        if (id === 'all') {
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            );
        }


        if (lowerName.includes('aqua')) {
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <path d="M12 12c.5-3 3-3 3-3s0 3-3 3z" />
                    <path d="M16 12l4-4v8l-4-4z" />
                </svg>
            );
        }

        if (lowerName.includes('marin')) {
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 14c.5-1.5 2-2 2-2s-1.5-.5-2-2" />
                    <path d="M2.5 12S5 5 12 5s9.5 7 9.5 7-2.5 7-9.5 7S2.5 12 2.5 12z" />
                    <circle cx="11.5" cy="12" r="2.5" />
                    <path d="M2 12l-1.5-3V15L2 12z" />
                </svg>
            );
        }

        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9z" />
                <path d="M12 12c2-2 5-2 5-2s-3 8-5 8-5-8-5-8 3 0 5 2z" />
            </svg>
        );
    };

    const fishCategoryLinks = [
        {
            name: 'Marine Fish',
            id: 'marine-fish',
            icon: getIcon('Marine Fish', 'marine-fish')
        },
        {
            name: 'Aqua Fish',
            id: 'aqua-fish',
            icon: getIcon('Aqua Fish', 'aqua-fish')
        },
        {
            name: 'Bangali Fish',
            id: 'bangali-fish',
            icon: getIcon('Bangali Fish', 'bangali-fish')
        }
    ];

    const navLinks = [
        {
            name: 'ALL',
            id: 'all',
            icon: getIcon('Home', 'all')
        },
        ...fishCategoryLinks
    ];

    const navSurfaceClass = isHome
        ? 'bg-gradient-to-b from-[#0C4A69]/95 via-[#0E5D82]/92 to-[#0B4F71]/88 border-b border-white/20 shadow-[0_12px_32px_rgba(5,30,45,0.35)]'
        : isCategorySection
            ? 'bg-gradient-to-b from-[#0C4A69]/95 via-[#0E5D82]/92 to-[#0B4F71]/88 border-b border-white/20 shadow-[0_12px_32px_rgba(5,30,45,0.35)]'
            : 'bg-gradient-to-b from-[#D8F5FF]/96 via-[#BEEFFF]/92 to-[#9DE7FF]/85 border-b border-[#4AAFD1]/25 shadow-[0_10px_26px_rgba(17,111,146,0.16)]';

    const activeIconClass = isHome
        ? 'text-white'
        : isCategorySection
            ? 'text-[#8BE7FF]'
            : 'text-[#0C7DA8]';
    const inactiveIconClass = isHome
        ? 'text-[#E9F9FF] group-hover:text-white'
        : isCategorySection
            ? 'text-[#DDF6FF] group-hover:text-[#8BE7FF]'
            : 'text-[#2D89AE] group-hover:text-[#0C7DA8]';
    const activeLabelClass = isHome
        ? 'text-white'
        : isCategorySection
            ? 'text-white'
            : 'text-[#07516E]';
    const inactiveLabelClass = isHome
        ? 'text-[#D7F0FF] group-hover:text-white'
        : isCategorySection
            ? 'text-[#D6F2FF] group-hover:text-white'
            : 'text-[#236E8E] group-hover:text-[#07516E]';
    const activeLabelShadow = isHome
        ? '0 2px 12px rgba(255,255,255,0.45)'
        : isCategorySection
            ? '0 2px 12px rgba(139,231,255,0.4)'
            : '0 2px 8px rgba(7,81,110,0.2)';
    const activeCircleClass = isHome
        ? 'bg-white/25'
        : isCategorySection
            ? 'bg-[#8BE7FF]/35'
            : 'bg-[#6FD3FF]/20';


    const handleNavClick = (id: string) => {
        // Find if this is a named category like 'aqua' but the ID is a mongoID or has a typo
        const link = navLinks.find(l => l.id === id);
        const name = link?.name.toLowerCase() || '';

        let effectiveId = id;
        if (name.includes('aqua') || name.includes('auqa')) effectiveId = 'aqua-fish';
        else if (name.includes('marin') || name.includes('marine')) effectiveId = 'marine-fish';
        else if (name.includes('bengali') || name.includes('bengoli')) effectiveId = 'bangali-fish';

        // Update context immediately for premium feel (glow moves instantly)
        setActiveCategory(effectiveId);

        // Update URL to trigger filtering and scroll in Home.tsx
        if (effectiveId === 'all') {
            internalNavigate('/user/home');
        } else {
            internalNavigate(`/?tab=${effectiveId}`);
        }
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-[100] h-[100px] flex items-center justify-center transition-all duration-500 transform ${isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            {/* Route-aware nav surface for stronger contrast on category pages */}
            <div className={`absolute inset-0 ${navSurfaceClass} backdrop-blur-[10px] pointer-events-none`} />
            <div className="w-full flex items-center justify-center px-14 sm:px-16 md:px-20 gap-4 sm:gap-7 md:gap-[60px]">
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
                                {activeCategory === link.id && (
                                    <motion.div
                                        layoutId="activeCircle"
                                        className={`absolute inset-0 rounded-full blur-[6px] ${activeCircleClass}`}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}

                                <div className={`
                                    transition-all duration-300
                                    ${activeCategory === link.id ? activeIconClass : inactiveIconClass}
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
                                ${activeCategory === link.id ? activeLabelClass : inactiveLabelClass}
                            `}
                                style={{
                                    textShadow: activeCategory === link.id ? activeLabelShadow : 'none'
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
