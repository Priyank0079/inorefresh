import React, { useEffect, useRef, useState } from 'react';

export interface RealtimeAlert {
  title: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

interface RealtimeAlertPopupProps {
  alert: RealtimeAlert | null;
  onClose: () => void;
  /** tailwind bg color for the header, e.g. 'bg-teal-600' */
  accent?: string;
  /** sound file under /public */
  sound?: string;
}

/**
 * Generic full-screen popup with looping sound for real-time alerts.
 * Used by the Admin and Port modules (same UX as the warehouse/delivery popups).
 */
const RealtimeAlertPopup: React.FC<RealtimeAlertPopupProps> = ({
  alert,
  onClose,
  accent = 'bg-teal-600',
  sound = '/assets/sound/seller_alert.mp3',
}) => {
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (alert && audioRef.current) {
      audioRef.current.volume = volume;
      const p = audioRef.current.play();
      if (p !== undefined) {
        p.catch((err) => console.error('❌ Error playing alert sound:', err?.name, err?.message));
      }
    }
  }, [alert, volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <audio ref={audioRef} src={sound} loop />

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${accent} text-white`}>
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h2 className="text-lg font-bold">{alert.title}</h2>
          </div>
          <button
            onClick={onClose}
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
          <p className="text-neutral-700 mb-6">{alert.message}</p>

          {/* Volume control */}
          <div className="mb-4 bg-neutral-50 p-3 rounded-lg flex items-center gap-4">
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
              className="flex-1 accent-teal-600"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
            >
              Dismiss
            </button>
            {alert.ctaLabel && (
              <button
                onClick={() => { const cb = alert.onCta; onClose(); cb?.(); }}
                className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${accent} hover:opacity-90`}
              >
                {alert.ctaLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeAlertPopup;
