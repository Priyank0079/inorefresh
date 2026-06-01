import { ReactNode, useEffect, useRef, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
// framer-motion removed from AppLayout — replaced with CSS animation to
// prevent AnimatePresence key changes from causing full content remount (CLS fix)
import FloatingCartPill from './FloatingCartPill';
import { useLocation as useLocationContext } from '../hooks/useLocation';
import LocationPermissionRequest from './LocationPermissionRequest';
import { useThemeContext } from '../context/ThemeContext';
import ServiceNotAvailable from './ServiceNotAvailable';
import { checkServiceability } from '../services/api/customerHomeService';
import AmbientFishBackground from './AmbientFishBackground';
import { UnderwaterEffect } from './UnderwaterEffect';
import OceanNavbar from './OceanNavbar';
import UserSidebar from './UserSidebar';
import GlobalBackButton from './GlobalBackButton';
import BottomNavigation from './BottomNavigation';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentTheme } = useThemeContext();
  const prefersReducedMotion = useReducedMotion();

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
  const showBackButton = !showLocationRequest && !showLocationChangeModal && !isAccountPage && !isHomePage && !isCheckoutPage;
  const showHeader = isSearchPage && !isCheckoutPage && !isCartPage;
  const showSearchBar = isSearchPage && !isCheckoutPage && !isCartPage;
  // Hide bottom nav on product detail — the page has its own sticky "Add to Cart / Buy Now" footer
  const showFooter = !isCheckoutPage && !isProductDetailPage;

  // Perf: the animated ocean backgrounds (fish + underwater motion) are expensive
  // framer-motion loops. Only run them on the Home page, and never when the user
  // prefers reduced motion. Other pages keep the static ocean gradient only.
  const showAmbientFx = isHomePage && !prefersReducedMotion;

  return (
    <>
      <div className="flex flex-col min-h-screen w-full relative overflow-x-hidden ocean-theme-bg">
        {showAmbientFx && <AmbientFishBackground />}
        {/* 💫 FLOATING WATER LIGHT EFFECT */}
        <div
          className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1]"
          style={{ background: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.15), transparent 70%)' }}
        />
        {/* Desktop Container Wrapper */}
        <div className="md:w-full md:bg-transparent md:min-h-screen overflow-x-hidden">
          <div className="md:w-full md:min-h-screen md:flex md:flex-col overflow-x-hidden relative z-10">
            {/* New OceanMart Navbar - Replaces both old navbar and sticky header */}
            {showOceanNavbar && <OceanNavbar onMenuClick={() => setIsSidebarOpen(true)} />}

            {showBackButton && (
              <GlobalBackButton
                theme={showOceanNavbar ? 'ocean' : 'light'}
                topOffsetClass="top-4 md:top-5"
                zIndexClass="z-[115]"
                fallbackPath="/"
              />
            )}


            {/* Scrollable Main Content */}
            <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24 md:pb-8 relative">
              {/* Global Underwater Atmosphere Layer (Home only, motion-safe) */}
              {showAmbientFx && (
                <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
                  <UnderwaterEffect />
                </div>
              )}

              {/*
                Key was previously tied to location state, causing the entire
                content tree to unmount + remount when location loaded → CLS.
                Replaced with a stable wrapper that uses a simple CSS opacity
                fade-in only on first mount (no re-mount on location changes).
              */}
              <div
                className="w-full max-w-full animate-fadeIn"
                style={{ minHeight: '100%' }}
              >
                {/* Service Availability Check */}
                {isLocationEnabled && userLocation && !isServiceAvailable && !showLocationRequest
                  ? <ServiceNotAvailable onChangeLocation={() => setShowLocationChangeModal(true)} />
                  : children
                }
              </div>
            </main>

            {/* Floating Cart Pill */}
            <FloatingCartPill />

            {/* Fixed Bottom Navigation - Mobile Only */}
            {showFooter && <BottomNavigation />}
          </div>
        </div>
      </div>

      {/* Modals & Sidebar outside main container for absolute positioning */}
      <UserSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {showLocationRequest && (
        <LocationPermissionRequest
          onLocationGranted={() => setShowLocationRequest(false)}
          skipable={false}
          title="Location Access Required"
          description="We need your location for 10-minute delivery services."
        />
      )}

      {showLocationChangeModal && (
        <LocationPermissionRequest
          onLocationGranted={() => setShowLocationChangeModal(false)}
          skipable={true}
          title="Change Location"
          description="Update your delivery location."
          forceOpen={true}
        />
      )}
    </>
  );
}

