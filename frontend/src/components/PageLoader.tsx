import { ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Minimal loading state that matches page background
 * Prevents flash by using same background as pages
 */
export default function PageLoader({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      {children || (
        <div className="flex min-h-[120px] min-w-[120px] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  );
}

