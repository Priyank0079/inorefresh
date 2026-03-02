import { useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getTheme } from '../../../utils/themes';
import { useLocation } from '../../../hooks/useLocation';
import { appConfig } from '../../../services/configService';
import { getCategories } from '../../../services/api/customerProductService';
import { Category } from '../../../types/domain';
import { getHeaderCategoriesPublic } from '../../../services/api/headerCategoryService';
import { getIconByName } from '../../../utils/iconLibrary';
import { useCart } from '../../../context/CartContext';
import { Link } from 'react-router-dom';
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
  const tabs = SEAFOOD_TABS;
  const navigate = useNavigate();
  const { cart } = useCart();
  const { location: userLocation } = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const topSectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [isSticky, setIsSticky] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Format location display text - only show if user has provided location
  const locationDisplayText = useMemo(() => {
    if (userLocation?.address) {
      // Use the full address if available
      return userLocation.address;
    }
    // Fallback to city, state format if available
    if (userLocation?.city && userLocation?.state) {
      return `${userLocation.city}, ${userLocation.state}`;
    }
    // Fallback to city only
    if (userLocation?.city) {
      return userLocation.city;
    }
    // No default - return empty string if no location provided
    return '';
  }, [userLocation]);

  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories for search suggestions
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        if (response.success && response.data) {
          setCategories(response.data.map((c: any) => ({
            ...c,
            id: c._id || c.id
          })));
        }
      } catch (error) {
        console.error("Error fetching categories for suggestions:", error);
      }
    };
    fetchCategories();
  }, []);

  // Search suggestions based on active tab or fetched categories
  const searchSuggestions = useMemo(() => {
    if (activeTab === 'all' && categories.length > 0) {
      // Use real category names for 'all' tab suggestions
      return categories.slice(0, 8).map(c => c.name.toLowerCase());
    }

    switch (activeTab) {
      case 'wedding':
        return ['gift packs', 'dry fruits', 'sweets', 'decorative items', 'wedding cards', 'return gifts'];
      case 'winter':
        return ['woolen clothes', 'caps', 'gloves', 'blankets', 'heater', 'winter wear'];
      case 'electronics':
        return ['chargers', 'cables', 'power banks', 'earphones', 'phone cases', 'screen guards'];
      case 'beauty':
        return ['lipstick', 'makeup', 'skincare', 'kajal', 'face wash', 'moisturizer'];
      case 'grocery':
        return ['atta', 'milk', 'dal', 'rice', 'oil', 'vegetables'];
      case 'fashion':
        return ['clothing', 'shoes', 'accessories', 'watches', 'bags', 'jewelry'];
      case 'sports':
        return ['cricket bat', 'football', 'badminton', 'fitness equipment', 'sports shoes', 'gym wear'];
      default: // 'all'
        return ['atta', 'milk', 'dal', 'coke', 'bread', 'eggs', 'rice', 'oil'];
    }
  }, [activeTab]);

  // Removed unused gsap hook

  // Placeholder simplified for static minimal look
  const placeholderText = "Search for fish";

  // Handle scroll to detect when "LOWEST PRICES EVER" section is out of view
  useEffect(() => {
    const handleScroll = () => {
      if (topSectionRef.current && stickyRef.current) {
        // Find the "LOWEST PRICES EVER" section
        const lowestPricesSection = document.querySelector('[data-section="lowest-prices"]');

        if (lowestPricesSection) {
          const sectionBottom = lowestPricesSection.getBoundingClientRect().bottom;
          // When the section has scrolled up past the viewport, transition to white
          const progress = Math.min(Math.max(1 - (sectionBottom / 200), 0), 1);
          setScrollProgress(progress);
          setIsSticky(sectionBottom <= 100);
        } else {
          // Fallback to original logic if section not found
          const topSectionBottom = topSectionRef.current.getBoundingClientRect().bottom;
          const topSectionHeight = topSectionRef.current.offsetHeight;
          const progress = Math.min(Math.max(1 - (topSectionBottom / topSectionHeight), 0), 1);
          setScrollProgress(progress);
          setIsSticky(topSectionBottom <= 0);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update sliding indicator position when activeTab changes and scroll to active tab
  useEffect(() => {
    const updateIndicator = (shouldScroll = true) => {
      const activeTabButton = tabRefs.current.get(activeTab);
      const container = tabsContainerRef.current;

      if (activeTabButton && container) {
        try {
          // Use offsetLeft for position relative to container (not affected by scroll)
          // This ensures the indicator stays aligned even when container scrolls
          const left = activeTabButton.offsetLeft;
          const width = activeTabButton.offsetWidth;

          // Ensure valid values
          if (width > 0) {
            setIndicatorStyle({ left, width });
          }

          // Scroll the container to bring the active tab into view (only when tab changes)
          if (shouldScroll) {
            const containerScrollLeft = container.scrollLeft;
            const containerWidth = container.offsetWidth;
            const buttonLeft = left;
            const buttonWidth = width;
            const buttonRight = buttonLeft + buttonWidth;

            // Calculate scroll position to center the button or keep it visible
            const scrollPadding = 20; // Padding from edges
            let targetScrollLeft = containerScrollLeft;

            // If button is on the left side and partially or fully hidden
            if (buttonLeft < containerScrollLeft + scrollPadding) {
              targetScrollLeft = buttonLeft - scrollPadding;
            }
            // If button is on the right side and partially or fully hidden
            else if (buttonRight > containerScrollLeft + containerWidth - scrollPadding) {
              targetScrollLeft = buttonRight - containerWidth + scrollPadding;
            }

            // Smooth scroll to the target position
            if (targetScrollLeft !== containerScrollLeft) {
              container.scrollTo({
                left: Math.max(0, targetScrollLeft),
                behavior: 'smooth'
              });
            }
          }
        } catch (error) {
          console.warn('Error updating indicator:', error);
        }
      }
    };

    // Update immediately with scroll
    updateIndicator(true);

    // Also update after delays to handle any layout shifts and ensure smooth animation
    const timeout1 = setTimeout(() => updateIndicator(true), 50);
    const timeout2 = setTimeout(() => updateIndicator(true), 150);
    const timeout3 = setTimeout(() => updateIndicator(false), 300); // Last update without scroll to avoid conflicts

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [activeTab]);

  const handleTabClick = (tabId: string) => {
    onTabChange?.(tabId);
    // Don't scroll - keep page at current position
  };

  const theme = getTheme(activeTab || 'all');
  const heroGradient = `linear-gradient(to bottom right, ${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`;

  // Helper to convert RGB to RGBA
  const rgbToRgba = (rgb: string, alpha: number) => {
    return rgb.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  };

  return (
    <div
      ref={heroRef}
      className="relative overflow-hidden z-40 bg-gradient-to-b from-[#003366] via-[#002b55] to-[#003366] pb-0"
    >
      {/* 🌊 PREMIUM UNDERWATER ATMOSPHERE */}
      <UnderwaterEffect />

      {/* 🌊 Abstract G-Shaped Ocean Current animated background effect - Refined Opacity */}
      <motion.div
        className="absolute top-0 right-0 w-[120%] h-[150%] md:w-[60%] md:h-[200%] origin-top-right pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 153, 153, 0.08) 0%, rgba(0,51,102,0) 70%)',
          filter: 'blur(40px)',
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
        }}
        animate={{
          rotate: [0, 5, -2, 0],
          x: [0, -20, 10, 0],
          y: [0, 20, -5, 0],
          scale: [1, 1.03, 0.97, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-10 right-[-10%] w-[80%] h-[100%] origin-center pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(0, 224, 198, 0.05) 0%, rgba(0,51,102,0) 60%)',
          filter: 'blur(50px)',
          borderRadius: '50% 30% 60% 40% / 60% 40% 50% 50%',
        }}
        animate={{
          x: [0, -15, 10, 0],
          y: [0, -20, 15, 0],
          rotate: [0, -3, 2, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Very soft vignette over layout constraints */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15 pointer-events-none z-0" />

      {/* Main Container */}
      <div className="relative z-10 w-full">
        {/* 1️⃣ BRAND + DELIVERY BLOCK */}
        <div ref={topSectionRef} className="px-5 md:px-8 pt-6 md:pt-8 pb-4 flex justify-between items-start">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex-1 pr-2"
          >
            {/* Service name - medium weight 85% white */}
            <div className="font-medium text-[11px] md:text-sm mb-0.5 leading-tight text-white/85 tracking-wide">
              Inor Fresh · Quick Commerce
            </div>

            {/* Delivery time - large, bold */}
            <div
              className="font-bold text-3xl md:text-4xl leading-tight text-white mb-2 tracking-tight"
              style={{ textShadow: '0 2px 10px rgba(0,20,40,0.5)' }}
            >
              {appConfig.estimatedDeliveryTime}
            </div>

            {/* Location row with GPS pin */}
            {locationDisplayText && (
              <div className="text-white/70 text-[11px] md:text-xs flex items-center gap-1.5 leading-tight font-medium">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-[#009999]">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span className="line-clamp-1 tracking-wide" title={locationDisplayText}>{locationDisplayText}</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sticky section: 2️⃣ SEARCH BLOCK and 3️⃣ CATEGORY NAV */}
        <div
          ref={stickyRef}
          className={`sticky top-0 z-50 transition-all duration-300 ${isSticky ? 'bg-[#003366]/80 backdrop-blur-xl border-b border-[#009999]/10 shadow-lg' : 'bg-transparent'}`}
        >
          {/* SEARCH BAR & CART ROW */}
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
              animate={{
                scale: isSearchFocused ? 1.015 : 1,
                borderColor: isSearchFocused ? 'rgba(0, 224, 198, 0.8)' : 'rgba(0, 224, 198, 0.25)',
                backgroundColor: isSearchFocused ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)',
                boxShadow: isSearchFocused
                  ? '0 8px 32px rgba(0, 224, 198, 0.15), 0 0 0 4px rgba(0, 224, 198, 0.05)'
                  : '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
              className="flex-1 max-w-2xl md:mx-auto rounded-2xl px-5 py-3.5 flex items-center gap-4 cursor-pointer relative z-10 border backdrop-blur-md transition-all duration-300"
            >
              <motion.div
                animate={{
                  scale: isSearchFocused ? 1.1 : 1,
                  rotate: isSearchFocused ? 10 : 0
                }}
                className="flex-shrink-0 text-[#00E0C6]"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.5" />
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </motion.div>

              <div className="flex-1 flex items-center h-6">
                <motion.span
                  animate={{
                    x: isSearchFocused ? 2 : 0,
                    opacity: isSearchFocused ? 1 : 0.7
                  }}
                  className="text-base text-white font-medium tracking-wide"
                >
                  {placeholderText}
                </motion.span>
              </div>

              {/* Subtle Mic icon for enhancement */}
              <div className="flex-shrink-0 text-white/40 hover:text-[#00E0C6] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </div>
            </motion.div>

            {/* 🛒 STICKY TOP RIGHT CART ICON */}
            <Link
              to="/checkout"
              className="w-[48px] h-[48px] rounded-[18px] flex items-center justify-center relative group transition-all duration-300 flex-shrink-0"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(0, 224, 198, 0.3)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="absolute inset-0 bg-[#00E0C6]/10 opacity-0 group-hover:opacity-100 rounded-[18px] transition-opacity duration-300" />

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
                {cart.itemCount > 0 && (
                  <motion.div
                    key="sticky-cart-badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-[#00E0C6] text-[#003366] text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-[#00E0C6]/40 z-20"
                    style={{ border: '2px solid #003366' }}
                  >
                    {cart.itemCount}
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </motion.div>

          {/* CATEGORY NAV */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="w-full relative overflow-hidden"
          >
            <motion.div
              ref={tabsContainerRef}
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              className="relative flex w-full overflow-x-auto scrollbar-hide px-6 md:px-8 justify-between scroll-smooth py-2 pt-1"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <motion.button
                    key={tab.id}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    ref={(el) => {
                      if (el) tabRefs.current.set(tab.id, el);
                      else tabRefs.current.delete(tab.id);
                    }}
                    onClick={() => handleTabClick(tab.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[70px] relative pb-3 pt-1 transition-all duration-300 z-10 outline-none`}
                    type="button"
                  >
                    <motion.div
                      className={`mb-2 transition-all duration-300 ${isActive ? 'text-white' : 'text-white/70'}`}
                      animate={{ scale: isActive ? 1.1 : 1 }}
                    >
                      {tab.icon}
                    </motion.div>
                    <span className={`text-[11px] md:text-xs whitespace-nowrap tracking-wide font-medium transition-all ${isActive ? 'text-white opacity-100' : 'text-white/70 opacity-70'}`}>
                      {tab.label}
                    </span>
                  </motion.button>
                )
              })}

              {/* Sliding Bottom Indicator - Glowing Underline */}
              {indicatorStyle.width > 0 && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 h-[3px] rounded-full bg-[#00E0C6] transition-all pointer-events-none"
                  initial={false}
                  animate={{
                    left: indicatorStyle.left + indicatorStyle.width * 0.1,
                    width: indicatorStyle.width * 0.8,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    mass: 0.5
                  }}
                  style={{
                    zIndex: 20,
                    boxShadow: '0 0 10px rgba(0, 224, 198, 0.6), 0 0 20px rgba(0, 224, 198, 0.3)'
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
