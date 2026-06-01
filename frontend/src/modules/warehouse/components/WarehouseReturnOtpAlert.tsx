import React, { useEffect, useRef, useState } from 'react';
import { ReturnOtpAlert } from '../hooks/useWarehouseSocket';

interface WarehouseReturnOtpAlertProps {
  alert: ReturnOtpAlert | null;
  onClose: () => void;
}

/**
 * Full-screen popup with looping sound shown when a rider arrives to deliver
 * returned goods. Displays the REAL OTP the warehouse must share with the rider
 * to confirm receipt (and trigger the refund).
 */
const WarehouseReturnOtpAlert: React.FC<WarehouseReturnOtpAlertProps> = ({ alert, onClose }) => {
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play looping alert sound while the OTP popup is open.
  useEffect(() => {
    if (alert && audioRef.current) {
      audioRef.current.volume = volume;
      const p = audioRef.current.play();
      if (p !== undefined) {
        p.catch((err) =>
          console.error('❌ Error playing return-OTP sound:', err?.name, err?.message)
        );
      }
    }
  }, [alert, volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  if (!alert) return null;

  const otpDigits = String(alert.otp || '').split('');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <audio ref={audioRef} src="/assets/sound/seller_alert.mp3" loop />

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between bg-teal-600 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold">Return Pickup OTP</h2>
              <p className="text-sm opacity-90">Order #{alert.orderNumber}</p>
            </div>
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
          <p className="text-neutral-600 mb-5">
            A rider has arrived to deliver returned goods. Share this OTP with the
            rider to confirm receipt and release the refund.
          </p>

          {/* OTP digits */}
          <div className="flex justify-center gap-3 mb-6">
            {otpDigits.map((d, i) => (
              <div
                key={i}
                className="w-14 h-16 rounded-xl border-2 border-teal-200 bg-teal-50 flex items-center justify-center text-3xl font-black text-teal-700"
              >
                {d}
              </div>
            ))}
          </div>

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

          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 bg-teal-600 hover:bg-teal-700"
          >
            Got it — OTP shared
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarehouseReturnOtpAlert;
