import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function BottomNavigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const { setActiveCategory } = useThemeContext();
    const { user } = useAuth();
    
    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/' || location.pathname === '/user/home';
        }
        return location.pathname.startsWith(path);
    };

    const handleHomeClick = (e: React.MouseEvent) => {
        // Reset category filter to 'all' when clicking home
        setActiveCategory('all');
        
        if (location.pathname === '/' || location.pathname === '/user/home') {
            e.preventDefault();
            // Scroll to top if already on home
            const mainElement = document.querySelector('main');
            if (mainElement) {
                mainElement.scrollTo({ top: 0, behavior: 'smooth' });
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const navItems = [
        {
            name: 'Home',
            path: '/',
            onClick: handleHomeClick,
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            )
        },
        {
            name: 'Categories',
            path: '/categories',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
            )
        },
        {
            name: 'Account',
            path: '/account',
            icon: user?.profileImage ? (
                <img 
                    src={user.profileImage} 
                    alt="Profile" 
                    className="w-6 h-6 rounded-full object-cover border border-white/40"
                />
            ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            )
        }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden h-[70px] flex items-center justify-around px-2 border-t border-white/10 bg-[#1FA9C6]/90 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
            {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                    <Link
                        key={item.name}
                        to={item.path}
                        onClick={item.onClick}
                        className="flex flex-col items-center justify-center h-full relative px-4"
                    >
                        <div className={`
                            relative z-10 transition-all duration-300 flex flex-col items-center
                            ${active ? 'text-white scale-110' : 'text-white/60 hover:text-white/80'}
                        `}>
                            <div className="relative">
                                {active && (
                                    <motion.div
                                        layoutId="nav-glow"
                                        className="absolute inset-0 bg-white/20 rounded-full blur-md"
                                        initial={false}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <div className="relative z-10">
                                    {item.icon}
                                </div>
                            </div>
                            <span className={`text-[10px] mt-1 font-bold tracking-tight uppercase ${active ? 'opacity-100' : 'opacity-60'}`}>
                                {item.name}
                            </span>
                        </div>
                        {active && (
                            <motion.div
                                layoutId="nav-indicator"
                                className="absolute -bottom-2 w-8 h-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
