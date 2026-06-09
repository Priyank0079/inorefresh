import { ReactNode, useRef, useState } from 'react';
import { useAdminPermission } from '../../../context/AdminPermissionContext';

interface WriteActionProps {
  children: ReactNode;
  /** Optional extra className forwarded to the wrapper span */
  className?: string;
}

/**
 * Wraps any write action (button, icon-button, etc.).
 * For Investor users the action is visually disabled and shows a
 * "Read-only access" tooltip on hover — no click passes through.
 */
export default function WriteAction({ children, className }: WriteActionProps) {
  const { isInvestor } = useAdminPermission();
  const [showTip, setShowTip] = useState(false);
  const tipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!isInvestor) return <>{children}</>;

  const handleMouseEnter = () => {
    tipTimeout.current = setTimeout(() => setShowTip(true), 120);
  };
  const handleMouseLeave = () => {
    if (tipTimeout.current) clearTimeout(tipTimeout.current);
    setShowTip(false);
  };

  return (
    <span
      className={`relative inline-flex ${className ?? ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Invisible click-blocker overlay */}
      <span
        className="absolute inset-0 z-10 cursor-not-allowed"
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
      />

      {/* Dimmed children */}
      <span className="pointer-events-none opacity-35 select-none">
        {children}
      </span>

      {/* Tooltip */}
      {showTip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap pointer-events-none">
          <span className="flex items-center gap-1.5 bg-neutral-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Investor access — read only
          </span>
          {/* arrow */}
          <span className="block w-2 h-2 bg-neutral-900 rotate-45 mx-auto -mt-1 rounded-sm" />
        </span>
      )}
    </span>
  );
}
