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

    const navLinks = [
        {
            name: 'Home',
            id: 'all',
            icon: getIcon('Home', 'all')
        },
        ...categories.map(cat => ({
            name: cat.name,
            id: cat.slug || cat._id,
            icon: getIcon(cat.name, cat.slug || cat._id)
        }))
    ];


    const handleNavClick = (id: string) => {
        // Find if this is a named category like 'aqua' but the ID is a mongoID or has a typo
        const link = navLinks.find(l => l.id === id);
        const name = link?.name.toLowerCase() || '';

        let effectiveId = id;
        if (name.includes('aqua') || name.includes('auqa')) effectiveId = 'aqua';
        else if (name.includes('marin')) effectiveId = 'marin';
        else if (name.includes('bengali') || name.includes('bengoli')) effectiveId = 'bengali';

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
            <div className="w-full flex items-center justify-center gap-[28px] md:gap-[60px]">
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
