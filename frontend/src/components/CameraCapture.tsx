import { useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, X } from 'lucide-react';

interface CameraCaptureProps {
  /** Called with the captured photo once the user confirms "Use Photo". */
  onCapture: (file: File) => void;
  /** Called when the overlay is dismissed (after capture or via the close button). */
  onClose: () => void;
}

/**
 * Full-screen in-app camera overlay — opens the device camera via getUserMedia
 * and shows a live preview with a shutter button, instead of handing off to an
 * external camera app (which is what `<input capture>` does on most browsers).
 */
export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ url: string; blob: Blob } | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not supported on this device/browser. Please use Gallery instead.');
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        if (!cancelled) setError('Camera access denied or unavailable. Please allow camera permission, or use Gallery instead.');
      });

    return () => {
      cancelled = true;
      stopStream();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url);
    };
  }, [photo]);

  const handleClose = () => {
    stopStream();
    onClose();
  };

  const handleShutter = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setPhoto({ url: URL.createObjectURL(blob), blob });
      },
      'image/jpeg',
      0.9
    );
  };

  const handleRetake = () => {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(null);
  };

  const handleUsePhoto = () => {
    if (!photo) return;
    const file = new File([photo.blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
    stopStream();
    onCapture(file);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="font-semibold text-sm">Take Photo</span>
        <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-white/10" aria-label="Close camera">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        {error ? (
          <p className="text-white text-sm px-8 text-center">{error}</p>
        ) : photo ? (
          <img src={photo.url} alt="Captured preview" className="max-h-full max-w-full object-contain" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="max-h-full max-w-full object-contain" />
        )}
      </div>

      <div className="flex items-center justify-center gap-6 py-6">
        {error ? (
          <button onClick={handleClose} className="px-6 py-2.5 bg-white text-black rounded-full font-semibold text-sm">
            Close
          </button>
        ) : photo ? (
          <>
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white rounded-full font-semibold text-sm hover:bg-white/25 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Retake
            </button>
            <button
              onClick={handleUsePhoto}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-full font-semibold text-sm hover:bg-teal-600 transition-colors"
            >
              <Camera className="w-4 h-4" /> Use Photo
            </button>
          </>
        ) : (
          <button
            onClick={handleShutter}
            aria-label="Capture photo"
            className="w-16 h-16 rounded-full bg-white border-4 border-white/30 active:scale-90 transition-transform"
          />
        )}
      </div>
    </div>
  );
}
