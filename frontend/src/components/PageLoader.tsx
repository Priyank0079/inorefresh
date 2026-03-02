import { ReactNode, useEffect, useState } from 'react';
import Lottie from 'lottie-react';

/**
 * Minimal loading state that matches page background
 * Prevents flash by using same background as pages
 */
export default function PageLoader({ children }: { children?: ReactNode }) {
  const [loadingAnimation, setLoadingAnimation] = useState<any>(null);

  useEffect(() => {
    fetch('/animations/loading.json')
      .then((response) => response.json())
      .then((data) => setLoadingAnimation(data))
      .catch((error) => {
        console.error('Failed to load page loader animation:', error);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      {children || (
        <div className="w-44 h-44">
          {loadingAnimation ? (
            <Lottie
              animationData={loadingAnimation}
              loop={true}
              autoplay={true}
            />
          ) : (
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mt-16" />
          )}
        </div>
      )}
    </div>
  );
}

