import { ReactNode, useEffect, useRef, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingCartPill from './FloatingCartPill';
import { useLocation as useLocationContext } from '../hooks/useLocation';
import LocationPermissionRequest from './LocationPermissionRequest';
import { useThemeContext } from '../context/ThemeContext';
import ServiceNotAvailable from './ServiceNotAvailable';
import { checkServiceability } from '../services/api/customerHomeService';
import AmbientFishBackground from './AmbientFishBackground';
import { UnderwaterEffect } from './UnderwaterEffect';
import OceanNavbar from './OceanNavbar';
import GlobalBackButton from './GlobalBackButton';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mainRef = useRef<HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [categoriesRotation, setCategoriesRotation] = useState(0);
  const [prevCategoriesActive, setPrevCategoriesActive] = useState(false);
  const { isLocationEnabled, isLocationLoading, location: userLocation } = useLocationContext();
  const [showLocationRequest, setShowLocationRequest] = useState(false);
  const [showLocationChangeModal, setShowLocationChangeModal] = useState(false);
  const { currentTheme } = useThemeContext();

  // State to track if service is available at user's location
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean>(true);

  // Check serviceability when user location changes
  useEffect(() => {
    // TEMPORARILY DISABLED FOR WALLET TESTING - UNCOMMENT TO RE-ENABLE
    // const performCheck = async () => {
    //   if (userLocation && userLocation.latitude && userLocation.longitude) {
    //     try {
    //       const result = await checkServiceability(userLocation.latitude, userLocation.longitude);
    //       setIsServiceAvailable(result.isServiceAvailable);
    //     } catch (error) {
    //       console.error("Failed to check serviceability:", error);
    //       // Default to true on error to avoid blocking user due to network issues
    //       setIsServiceAvailable(true);
    //     }
    //   } else {
    //     // If no location, we can't determine, so we assume available or waiting for location
    //     setIsServiceAvailable(true);
    //   }
    // };

    // performCheck();

    // TEMPORARY: Always set service as available for wallet testing
    setIsServiceAvailable(true);
  }, [userLocation]);

  const isActive = (path: string) => location.pathname === path;

  // ... (rest of the component logic)

  // Check if location is required for current route
  const requiresLocation = () => {
    const publicRoutes = ['/login', '/signup', '/seller/login', '/seller/signup', '/delivery/login', '/delivery/signup', '/admin/login'];
    // Don't require location on login/signup pages
    if (publicRoutes.includes(location.pathname)) {
      return false;
    }
    // Require location for ALL routes (not just authenticated users)
    // This ensures location is mandatory for everyone visiting the platform
    return true;
  };

  // ... (rest of the component logic)

  // ...

  // ALWAYS show location request modal on app load if location is not enabled
  // This ensures modal appears on every app open, regardless of browser permission state
  useEffect(() => {
    // Wait for initial loading to complete
    if (isLocationLoading) {
      return;
    }

    // If location is enabled, hide modal
    if (isLocationEnabled) {
      setShowLocationRequest(false);
      return;
    }

    // If location is NOT enabled and route requires location, ALWAYS show modal
    // This will trigger on every app open until user explicitly confirms location
    if (!isLocationEnabled && requiresLocation()) {
      setShowLocationRequest(true);
    } else {
      setShowLocationRequest(false);
    }
  }, [isLocationLoading, isLocationEnabled, location.pathname]);

  // ...



  // Update search query when URL params change
  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
  }, [searchParams]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (location.pathname === '/search') {
      // Update URL params when on search page
      if (value.trim()) {
        setSearchParams({ q: value });
      } else {
        setSearchParams({});
      }
    } else {
      // Navigate to search page with query
      if (value.trim()) {
        navigate(`/search?q=${encodeURIComponent(value)}`);
      }
    }
  };


  const isHomePage = location.pathname === '/' || location.pathname === '/user/home';
  const SCROLL_POSITION_KEY = 'home-scroll-position';

  useEffect(() => {
    // Home page handles its own scroll restoration and reset logic
    if (isHomePage) {
      return;
    }

    // Use requestAnimationFrame to prevent visual flash
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      // Also reset window scroll smoothly
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, [location.pathname, isHomePage]);

  // Track categories active state for rotation
  const isCategoriesActive = isActive('/categories') || location.pathname.startsWith('/category/');

  useEffect(() => {
    if (isCategoriesActive && !prevCategoriesActive) {
      // Rotate clockwise when clicked (becoming active)
      setCategoriesRotation(prev => prev + 360);
      setPrevCategoriesActive(true);
    } else if (!isCategoriesActive && prevCategoriesActive) {
      // Rotate counter-clockwise when unclicked (becoming inactive)
      setCategoriesRotation(prev => prev - 360);
      setPrevCategoriesActive(false);
    }
  }, [isCategoriesActive, prevCategoriesActive]);

  const isProductDetailPage = location.pathname.startsWith('/product/');
  const isSearchPage = location.pathname === '/search';
  const isCheckoutPage = location.pathname === '/checkout' || location.pathname.startsWith('/checkout/');
  const isCartPage = location.pathname === '/cart';
  const isAccountPage = location.pathname === '/account';
  const isExploreCategoriesPage = location.pathname === '/categories';
  const showOceanNavbar = !isCheckoutPage && !isCartPage && !isAccountPage && !isExploreCategoriesPage;
  const showBackButton = !showLocationRequest && !showLocationChangeModal && !isAccountPage && !isHomePage;
  const showHeader = isSearchPage && !isCheckoutPage && !isCartPage;
  const showSearchBar = isSearchPage && !isCheckoutPage && !isCartPage;
  const showFooter = !isCheckoutPage && !isProductDetailPage;

  return (
    <div className="flex flex-col min-h-screen w-full relative overflow-x-hidden ocean-theme-bg">
      <AmbientFishBackground />
      {/* 💫 FLOATING WATER LIGHT EFFECT */}
      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.15), transparent 70%)' }}
      />
      {/* Desktop Container Wrapper */}
      <div className="md:w-full md:bg-transparent md:min-h-screen overflow-x-hidden">
        <div className="md:w-full md:min-h-screen md:flex md:flex-col overflow-x-hidden relative z-10">
          {/* New OceanMart Navbar - Replaces both old navbar and sticky header */}
          {showOceanNavbar && <OceanNavbar />}

          {showBackButton && (
            <GlobalBackButton
              theme={showOceanNavbar ? 'ocean' : 'light'}
              topOffsetClass={showOceanNavbar ? 'top-4 md:top-5' : 'top-4 md:top-5'}
              zIndexClass={showOceanNavbar ? 'z-[115]' : 'z-40'}
              fallbackPath="/"
            />
          )}


          {/* Scrollable Main Content */}
          <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24 md:pb-8 relative">
            {/* Global Underwater Atmosphere Layer */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
              <UnderwaterEffect />
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isLocationEnabled && userLocation ? 'content' : 'location-check'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-full"
                style={{ minHeight: '100%' }}
              >
                {/* Service Availability Check */}
                {
                  (() => {
                    // If we have a location but service is NOT available, show the unavailable screen
                    // We check the component state 'isServiceAvailable' which is updated by useEffect
                    if (isLocationEnabled && userLocation && !isServiceAvailable && !showLocationRequest) {
                      return <ServiceNotAvailable onChangeLocation={() => setShowLocationChangeModal(true)} />;
                    }
                    return children;
                  })()
                }
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Floating Cart Pill */}
          <FloatingCartPill />

          {/* Location Permission Request Modal - Mandatory for all users */}
          {showLocationRequest && (
            <LocationPermissionRequest
              onLocationGranted={() => setShowLocationRequest(false)}
              skipable={false}
              title="Location Access Required"
              description="We need your location to show you products available near you and enable delivery services. Location access is required to continue."
            />
          )}

          {/* Location Change Modal */}
          {showLocationChangeModal && (
            <LocationPermissionRequest
              onLocationGranted={() => setShowLocationChangeModal(false)}
              skipable={true}
              title="Change Location"
              description="Update your location to see products available near you."
              forceOpen={true}
            />
          )}

          {/* Fixed Bottom Navigation - Mobile Only */}
          {showFooter && (
            <nav
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden h-[70px] flex items-center justify-around px-2 border-t border-white/10"
              style={{
                background: '#1FA9C6',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.15)'
              }}
            >
              {[
                {
                  name: 'Home',
                  path: '/',
                  altPaths: ['/user/home'],
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  )
                },
                {
                  name: 'Explore',
                  path: '/categories',
                  altPaths: ['/category/'],
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )
                },
                {
                  name: 'Profile',
                  path: '/account',
                  altPaths: [],
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )
                }
              ].map((item) => {
                const isItemActive = isActive(item.path) || item.altPaths.some(p => location.pathname.startsWith(p));
                return (
                  <motion.div
                    key={item.name}
                    whileTap={{ scale: 0.9 }}
                    className="flex-1"
                  >
                    <Link
                      to={item.path}
                      className="flex flex-col items-center justify-center h-full relative"
                    >
                      <div className={`
                        flex flex-col items-center justify-center transition-all duration-300
                        ${isItemActive ? 'text-[#FFFFFF]' : 'text-[rgba(255,255,255,0.7)]'}
                      `}>
                        <div className="relative">
                          {isItemActive && (
                            <motion.div
                              layoutId="bottom-nav-glow"
                              className="absolute inset-0 bg-[#FFFFFF]/20 rounded-full blur-[10px]"
                            />
                          )}
                          <div className="relative z-10 transition-transform duration-300 transform" style={{ scale: isItemActive ? 1.1 : 1 }}>
                            {item.icon}
                          </div>
                        </div>
                        <span className={`text-[11px] mt-1 font-bold tracking-wide transition-all ${isItemActive ? 'text-[#FFFFFF]' : 'text-[rgba(255,255,255,0.7)]'}`}>
                          {item.name}
                        </span>
                      </div>

                      {isItemActive && (
                        <motion.div
                          layoutId="bottom-indicator"
                          className="absolute -bottom-2 w-10 h-[3px] bg-[#FFFFFF] rounded-full"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

