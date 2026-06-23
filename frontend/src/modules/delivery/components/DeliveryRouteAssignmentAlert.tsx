import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface RouteAssignmentAlertData {
  routeNumber: string;
  message: string;
  link: string;
  timestamp: Date;
}

interface DeliveryRouteAssignmentAlertProps {
  alert: RouteAssignmentAlertData | null;
  onClose: () => void;
}

/**
 * Full-screen popup with looping sound shown to the rider when the
 * warehouse assigns a route to them.
 */
const DeliveryRouteAssignmentAlert: React.FC<DeliveryRouteAssignmentAlertProps> = ({ alert, onClose }) => {
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!alert) return;
    const raf = requestAnimationFrame(() => {
      if (audioRef.current) {
        audioRef.current.volume = volume;
        const p = audioRef.current.play();
        if (p !== undefined) p.catch(() => {});
      }
    });
    const timer = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }, 15000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [alert, volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  if (!alert) return null;

  // Stop the looping alert sound immediately on any interaction.
  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleClose = () => {
    stopSound();
    onClose();
  };

  const goRoute = () => {
    stopSound();
    onClose();
    navigate(alert.link || '/delivery/route/today');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <audio ref={audioRef} src="/assets/sound/delivery-alert.mp3" loop />

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between bg-amber-600 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold">New Route Assigned</h2>
              <p className="text-sm opacity-95">{alert.routeNumber}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white hover:bg-opacity-10 p-1 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-neutral-700 mb-6 text-sm md:text-base leading-relaxed">
            {alert.message}
          </p>

          {/* Volume control */}
          <div className="mb-6 bg-neutral-50 p-3 rounded-lg flex items-center gap-4">
            <span className="text-neutral-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 accent-amber-600"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl font-semibold bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={goRoute}
              className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 bg-amber-600 hover:bg-amber-700"
            >
              View Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryRouteAssignmentAlert;
