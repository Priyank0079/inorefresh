import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

type BackButtonTheme = 'ocean' | 'light';

interface GlobalBackButtonProps {
  fallbackPath?: string;
  topOffsetClass?: string;
  rightOffsetClass?: string;
  zIndexClass?: string;
  theme?: BackButtonTheme;
  className?: string;
}

function resolveFallbackPath(pathname: string): string {
  if (pathname.startsWith('/admin')) return '/admin';
  if (pathname.startsWith('/warehouse')) return '/warehouse';
  if (pathname.startsWith('/delivery')) return '/delivery';
  return '/';
}

export default function GlobalBackButton({
  fallbackPath,
  topOffsetClass = 'top-4 md:top-5',
  rightOffsetClass = 'left-4 md:left-6',
  zIndexClass = 'z-40',
  theme = 'light',
  className = '',
}: GlobalBackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const safeFallback = fallbackPath || resolveFallbackPath(location.pathname);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(safeFallback, { replace: true });
  };

  const themeClasses =
    theme === 'ocean'
      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-[0_12px_28px_rgba(7,47,74,0.25)]'
      : 'bg-[#1CA7C7] hover:bg-[#168FAD] text-white border border-white/20 shadow-[0_12px_24px_rgba(22,143,173,0.35)]';

  return (
    <motion.button
      type="button"
      onClick={handleBack}
      whileHover={{ y: -1, scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      aria-label="Go back"
      className={`fixed ${topOffsetClass} ${rightOffsetClass} ${zIndexClass} ${themeClasses} ${className} group w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:ring-offset-2`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 group-hover:-translate-x-0.5"
      >
        <path
          d="M15 18L9 12L15 6"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
}
