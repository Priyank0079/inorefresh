import { useNavigate, Link } from 'react-router-dom';
import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '../../../hooks/useLocation';
import { appConfig } from '../../../services/configService';
import { useCart } from '../../../context/CartContext';
import { UnderwaterEffect } from '../../../components/UnderwaterEffect';

interface HomeHeroProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SEAFOOD_TABS: Tab[] = [
  {
    id: 'all',
    label: 'Home',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'aqua',
    label: 'Aqua Fish',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16.3c2.2 0 4-1.8 4-4 0-3.3-4-6-4-6s-4 2.7-4 6c0 2.2 1.8 4 4 4Z" />
        <path d="M17 18.5c1.7 0 3-1.3 3-3 0-2.5-3-4.5-3-4.5s-3 2-3 4.5c0 1.7 1.3 3 3 3Z" />
      </svg>
    ),
  },
  {
    id: 'marin',
    label: 'Marin Fish',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      </svg>
    ),
  },
  {
    id: 'bengali',
    label: 'Bengali Fish',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 12c.94 0 1.89.11 2.83.31 1.59.34 3.19.08 4.77-.71 1.5-.75 3.16-.91 4.76-.48.42.11.84.17 1.28.17 1.14 0 2.42-.43 2.52-1.72.01-.12.01-.24 0-.35-.11-1.29-1.39-1.72-2.52-1.72-.44 0-.86.06-1.28.17-1.6.43-3.26.27-4.76-.48-1.58-.79-3.18-1.05-4.77-.71-.94.2-1.89.31-2.83.31-1.15 0-2.1-.33-2.59-1.03l-1.41-2.02c-.41-.59-1.21-.73-1.79-.32l-.4.28c-.59.41-.73 1.21-.32 1.79l1.41 2.02c.49.7 1.44 1.03 2.59 1.03z" />
        <path d="M2 12c.49.7 1.44 1.03 2.59 1.03.94 0 1.89-.11 2.83-.31 1.59-.34 3.19-.08 4.77.71 1.5.75 3.16.91 4.76.48.42-.11.84-.17 1.28-.17 1.14 0 2.42.43 2.52 1.72.01.12.01.24 0 .35-.11 1.29-1.39 1.72-2.52 1.72-.44 0-.86-.06-1.28-.17-1.6-.43-3.26-.27-4.76.48-1.58.79-3.18 1.05-4.77.71-.94-.2-1.89-.31-2.83-.31-1.15 0-2.1.33-2.59 1.03l-1.41 2.02c-.41.59-1.21.73-1.79.32l-.4-.28c-.59-.41-.73-1.21-.32-1.79l1.41-2.02C1.04 12.33 2 12 2 12z" />
      </svg>
    ),
  }
];

export default function HomeHero({ activeTab = 'all', onTabChange }: HomeHeroProps) {
  const navigate = useNavigate();
  const { cart } = useCart();
  const cartItemCount = cart.itemCount ?? 0;
  const { location: userLocation } = useLocation();

  const topSectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const [isSticky, setIsSticky] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const heroParticles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: `${8 + (i * 8) % 86}%`,
        top: `${10 + (i * 7) % 74}%`,
        size: 2 + (i % 3),
        duration: 8 + (i % 5),
        delay: i * 0.7,
      })),
    []
  );

  const locationDisplayText = useMemo(() => {
    if (userLocation?.address) return userLocation.address;
    if (userLocation?.city && userLocation?.state) return `${userLocation.city}, ${userLocation.state}`;
    if (userLocation?.city) return userLocation.city;
    return '';
  }, [userLocation]);

  useEffect(() => {
    const handleScroll = () => {
      if (!topSectionRef.current || !stickyRef.current) return;
      const lowestPricesSection = document.querySelector('[data-section="lowest-prices"]');
      if (lowestPricesSection) {
        const sectionBottom = lowestPricesSection.getBoundingClientRect().bottom;
        setIsSticky(sectionBottom <= 100);
      } else {
        const topSectionBottom = topSectionRef.current.getBoundingClientRect().bottom;
        setIsSticky(topSectionBottom <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateIndicator = (shouldScroll = true) => {
      const activeTabButton = tabRefs.current.get(activeTab);
      const container = tabsContainerRef.current;
      if (!activeTabButton || !container) return;

      const left = activeTabButton.offsetLeft;
      const width = activeTabButton.offsetWidth;
      if (width > 0) setIndicatorStyle({ left, width });

      if (!shouldScroll) return;
      const containerScrollLeft = container.scrollLeft;
      const containerWidth = container.offsetWidth;
      const buttonLeft = left;
      const buttonRight = buttonLeft + width;
      const scrollPadding = 20;

      let targetScrollLeft = containerScrollLeft;
      if (buttonLeft < containerScrollLeft + scrollPadding) {
        targetScrollLeft = buttonLeft - scrollPadding;
      } else if (buttonRight > containerScrollLeft + containerWidth - scrollPadding) {
        targetScrollLeft = buttonRight - containerWidth + scrollPadding;
      }

      if (targetScrollLeft !== containerScrollLeft) {
        container.scrollTo({ left: Math.max(0, targetScrollLeft), behavior: 'smooth' });
      }
    };

    updateIndicator(true);
    const t1 = setTimeout(() => updateIndicator(true), 50);
    const t2 = setTimeout(() => updateIndicator(true), 150);
    const t3 = setTimeout(() => updateIndicator(false), 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeTab]);

  return (
    <div
      className="relative overflow-hidden z-40 pb-0"
      style={{
        background: 'linear-gradient(180deg, #0f2f4f 0%, #0d3d63 40%, #0c466f 100%)',
      }}
    >
      <UnderwaterEffect />

      <motion.div
        className="absolute -top-16 -left-10 w-[58%] h-[52%] pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(28,167,166,0.08) 38%, rgba(15,47,79,0) 75%)',
          filter: 'blur(28px)',
        }}
        animate={{
          x: [0, 18, -8, 0],
          y: [0, -10, 8, 0],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute -top-8 left-[36%] w-[46%] h-[38%] pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle, rgba(28,167,166,0.24) 0%, rgba(28,167,166,0.06) 45%, rgba(12,70,111,0) 78%)',
          filter: 'blur(24px)',
        }}
        animate={{
          x: [0, -14, 8, 0],
          y: [0, 7, -5, 0],
          opacity: [0.22, 0.45, 0.22],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="absolute inset-0 bg-white/[0.05] backdrop-blur-[1px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/25 pointer-events-none z-0" />

      {heroParticles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-white/30 pointer-events-none z-0"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            top: p.top,
            filter: 'blur(0.5px)',
          }}
          animate={{ y: [0, -16, 0], opacity: [0.08, 0.28, 0.08] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="relative z-10 w-full">
        <div ref={topSectionRef} className="px-5 md:px-8 pt-6 md:pt-8 pb-4 flex justify-between items-start">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex-1 pr-2"
          >
            <div className="font-medium text-[11px] md:text-sm mb-0.5 leading-tight text-white/85 tracking-wide">
              Inor Fresh - Quick Commerce
            </div>

            <div
              className="font-bold text-3xl md:text-4xl leading-tight text-white mb-2 tracking-tight"
              style={{ textShadow: '0 2px 10px rgba(0,20,40,0.5)' }}
            >
              {appConfig.estimatedDeliveryTime}
            </div>

            {locationDisplayText && (
              <div className="text-white/70 text-[11px] md:text-xs flex items-center gap-1.5 leading-tight font-medium">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-[#1ca7a6]">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span className="line-clamp-1 tracking-wide" title={locationDisplayText}>{locationDisplayText}</span>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.08, boxShadow: '0 0 24px rgba(255,255,255,0.28)' }}
            className="relative shrink-0 h-11 md:h-12 w-auto px-2 rounded-xl flex items-center justify-center"
          >
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.26) 0%, rgba(28,167,166,0.16) 35%, rgba(15,47,79,0) 76%)',
                filter: 'blur(10px)',
              }}
            />
            <img
              src="/images/inor_logo_trans.png"
              alt="Inor Fresh"
              className="relative h-11 md:h-12 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/inor_logo_header.png';
              }}
            />
          </motion.div>
        </div>

        <div
          ref={stickyRef}
          className={`sticky top-0 z-50 transition-all duration-300 ${isSticky ? 'bg-[#0f2f4f]/65 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_24px_rgba(2,14,29,0.35)]' : 'bg-transparent'}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="px-6 md:px-8 pt-3 pb-4 flex items-center gap-3 overflow-visible"
          >
            <motion.div
              onClick={() => navigate('/search')}
              onMouseEnter={() => setIsSearchFocused(true)}
              onMouseLeave={() => setIsSearchFocused(false)}
              whileHover={{ y: -1.5 }}
              animate={{
                scale: isSearchFocused ? 1.02 : 1,
                borderColor: isSearchFocused ? 'rgba(28, 167, 166, 0.9)' : 'rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                boxShadow: isSearchFocused
                  ? '0 10px 30px rgba(28,167,166,0.2), 0 0 0 3px rgba(28,167,166,0.14), inset 0 1px 4px rgba(255,255,255,0.22)'
                  : '0 4px 14px rgba(3,15,28,0.25), inset 0 1px 4px rgba(255,255,255,0.12)',
              }}
              className="flex-1 max-w-2xl md:mx-auto rounded-2xl h-[54px] px-4 flex items-center gap-4 cursor-pointer relative z-10 border backdrop-blur-[14px] transition-all duration-300"
            >
              <motion.div
                animate={{
                  scale: isSearchFocused ? 1.1 : [1, 1.04, 1],
                  rotate: isSearchFocused ? 8 : 0,
                }}
                transition={isSearchFocused ? { duration: 0.2 } : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="flex-shrink-0 text-[#1ca7a6]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.5" />
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </motion.div>

              <div className="flex-1 flex items-center h-6">
                <span className="text-[15px] text-white/85 font-medium tracking-wide">
                  Search fresh fish, prawns, crabs...
                </span>
              </div>

              <motion.div
                className="flex-shrink-0 text-white/60"
                animate={{
                  opacity: [0.65, 1, 0.65],
                  boxShadow: ['0 0 0 rgba(28,167,166,0)', '0 0 16px rgba(28,167,166,0.25)', '0 0 0 rgba(28,167,166,0)'],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </motion.div>
            </motion.div>

            <Link
              to="/checkout"
              className="w-[48px] h-[48px] rounded-[18px] flex items-center justify-center relative group transition-all duration-300 flex-shrink-0"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 6px 16px rgba(3,15,28,0.25)',
              }}
            >
              <div className="absolute inset-0 bg-[#1ca7a6]/10 opacity-0 group-hover:opacity-100 rounded-[18px] transition-opacity duration-300" />

              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="relative z-10 transition-transform group-hover:scale-110"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>

              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.div
                    key="sticky-cart-badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-[#1ca7a6] text-[#0f2f4f] text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-[#1ca7a6]/40 z-20"
                    style={{ border: '2px solid #0f2f4f' }}
                  >
                    {cartItemCount}
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="w-full relative overflow-hidden px-4 md:px-6 pb-3"
          >
            <motion.div
              ref={tabsContainerRef}
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.06,
                  },
                },
              }}
              className="relative flex w-full overflow-x-auto scrollbar-hide px-2 md:px-3 justify-between scroll-smooth py-2 rounded-[18px] border border-white/10 bg-white/[0.05] backdrop-blur-[12px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_8px_20px_rgba(2,14,29,0.25)]"
            >
              {indicatorStyle.width > 0 && (
                <motion.div
                  className="absolute bottom-[4px] h-[5px] rounded-full bg-[#1ca7a6] pointer-events-none"
                  initial={false}
                  animate={{
                    left: indicatorStyle.left + indicatorStyle.width * 0.18,
                    width: indicatorStyle.width * 0.64,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 32,
                    mass: 0.55,
                  }}
                  style={{
                    zIndex: 20,
                    boxShadow: '0 0 10px rgba(28,167,166,0.65), 0 0 18px rgba(28,167,166,0.35)',
                  }}
                />
              )}

              {SEAFOOD_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    ref={(el) => {
                      if (el) tabRefs.current.set(tab.id, el);
                      else tabRefs.current.delete(tab.id);
                    }}
                    onClick={() => onTabChange?.(tab.id)}
                    whileHover={{ y: -2, scale: 1.03, rotate: 3 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-shrink-0 flex flex-col items-center justify-center min-w-[70px] relative pb-3 pt-1 transition-all duration-300 z-10 outline-none"
                    type="button"
                  >
                    <motion.div
                      className={`mb-2 transition-all duration-300 ${isActive ? 'text-white' : 'text-white/70'}`}
                      animate={{
                        scale: isActive ? 1.08 : 1,
                        filter: isActive ? 'drop-shadow(0 0 8px rgba(28,167,166,0.55))' : 'none',
                      }}
                    >
                      {tab.icon}
                    </motion.div>
                    <span className={`text-[11px] md:text-xs whitespace-nowrap tracking-wide font-medium transition-all ${isActive ? 'text-white opacity-100' : 'text-white/70 opacity-75'}`}>
                      {tab.label}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
