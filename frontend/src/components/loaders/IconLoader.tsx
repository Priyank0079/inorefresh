import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../../context/LoadingContext';
import LoadingSpinner from '../LoadingSpinner';

interface IconLoaderProps {
  forceShow?: boolean;
}

const IconLoader: React.FC<IconLoaderProps> = ({ forceShow = false }) => {
  const { isRouteLoading } = useLoading();
  const show = isRouteLoading || forceShow;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-white/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex min-h-[120px] min-w-[120px] items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IconLoader;
