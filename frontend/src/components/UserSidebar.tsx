import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getHeaderCategoriesPublic } from '../services/api/headerCategoryService';
import { useThemeContext } from '../context/ThemeContext';

interface UserSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UserSidebar({ isOpen, onClose }: UserSidebarProps) {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<any[]>([]);
    const { activeCategory, setActiveCategory } = useThemeContext();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getHeaderCategoriesPublic();
                if (data && Array.isArray(data)) {
                    const published = data.filter((cat: any) => cat.status === 'Published');
                    setCategories(published);
                }
            } catch (error) {
                console.error("Error fetching categories for sidebar:", error);
            }
        };
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const handleCategoryClick = (id: string) => {
        setActiveCategory(id);
        if (id === 'all') {
            navigate('/');
        } else {
            navigate(`/?tab=${id}`);
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
                    />

                    {/* Sidebar Content */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-[280px] sm:w-[320px] bg-[#072F4A] shadow-2xl z-[1001] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0C4A69] to-[#072F4A]">
                            <h2 className="text-xl font-black text-white tracking-tight">
                                CATEGORIES
                            </h2>
                            <button 
                                onClick={onClose}
                                className="p-2 text-white/70 hover:text-white transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Category List */}
                        <div className="flex-1 overflow-y-auto py-4 px-2 scrollbar-hide">
                            <button
                                onClick={() => handleCategoryClick('all')}
                                className={`
                                    w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 mb-2
                                    ${activeCategory === 'all' ? 'bg-[#1CA7C7] text-white shadow-lg' : 'text-white/60 hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeCategory === 'all' ? 'bg-white/20' : 'bg-white/5'}`}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                </div>
                                <span className="font-bold tracking-wide">All Products</span>
                            </button>

                            {categories.map((cat) => (
                                <button
                                    key={cat._id}
                                    onClick={() => handleCategoryClick(cat.slug || cat._id)}
                                    className={`
                                        w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 mb-2
                                        ${activeCategory === (cat.slug || cat._id) ? 'bg-[#1CA7C7] text-white shadow-lg' : 'text-white/60 hover:bg-white/5 hover:text-white'}
                                    `}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeCategory === (cat.slug || cat._id) ? 'bg-white/20' : 'bg-white/5'}`}>
                                        {cat.image ? (
                                            <img src={cat.image} alt="" className="w-6 h-6 object-contain opacity-80" />
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 7h-9" />
                                                <path d="M14 17H5" />
                                                <circle cx="17" cy="17" r="3" />
                                                <circle cx="7" cy="7" r="3" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="font-bold tracking-wide">{cat.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-black/20">
                            <p className="text-xs text-white/30 uppercase tracking-[0.2em] text-center font-bold">
                                INORFRESH 10-MIN DELIVERY
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
