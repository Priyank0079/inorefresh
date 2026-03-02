import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    id: 'aqua',
    title: 'AQUA FISH',
    desc: 'Bright silver-blue tone and clean marine look',
    image: '/images/aqua_fish.png',
  },
  {
    id: 'marin',
    title: 'MARIN FISH',
    desc: 'Deeper ocean tone with premium sea profile',
    image: '/images/marin_fish.png',
  },
  {
    id: 'bengali',
    title: 'BENGALI FISH',
    desc: 'Traditional freshwater selection with rich texture',
    image: '/images/bengali_fish.png',
  },
];

export default function FishCarouselBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const bubbles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${6 + (i * 7) % 88}%`,
        size: 4 + (i % 4) * 2,
        duration: 6 + (i % 5),
        delay: i * 0.45,
      })),
    []
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="w-full px-4 pt-2 pb-0 mb-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.26, ease: 'easeOut' }}
    >
      <motion.div
        className="relative rounded-[22px] overflow-hidden border border-white/10 shadow-[0_18px_42px_rgba(3,15,28,0.45)]"
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: '16/9',
            maxHeight: '250px',
            background: 'linear-gradient(145deg, #0f3d63, #116466)',
          }}
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 18% 14%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 26%, rgba(15,61,99,0) 62%)',
              filter: 'blur(1px)',
            }}
            animate={{ opacity: [0.5, 0.75, 0.5], x: [0, 10, 0], y: [0, -4, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 84% 24%, rgba(28,167,166,0.18) 0%, rgba(28,167,166,0.02) 35%, rgba(15,61,99,0) 70%)',
              filter: 'blur(2px)',
            }}
            animate={{ opacity: [0.45, 0.7, 0.45], x: [0, -8, 0], y: [0, 6, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute inset-0 pointer-events-none mix-blend-screen"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 64%)',
            }}
            animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.24, 0.42, 0.24] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div
            className="absolute inset-0 pointer-events-none opacity-[0.11]"
            style={{
              backgroundImage:
                'repeating-radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0 1px, transparent 1px 5px)',
            }}
          />

          {bubbles.map((bubble) => (
            <motion.span
              key={bubble.id}
              className="absolute bottom-[-24px] rounded-full bg-white/30 pointer-events-none"
              style={{
                width: bubble.size,
                height: bubble.size,
                left: bubble.left,
                boxShadow: '0 0 10px rgba(255,255,255,0.18)',
              }}
              animate={{ y: [0, -280], opacity: [0, 0.42, 0], x: [0, bubble.id % 2 === 0 ? 8 : -8, 0] }}
              transition={{
                duration: bubble.duration,
                delay: bubble.delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}

          <AnimatePresence mode="wait">
            <motion.div
              key={slides[currentIndex].id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.img
                src={slides[currentIndex].image}
                alt={slides[currentIndex].title}
                className="absolute inset-0 w-full h-full object-cover"
                animate={{ scale: [1.01, 1.08, 1.01] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-[#0f2f4f]/65 via-[#0f2f4f]/20 to-transparent pointer-events-none" />
          <div className="absolute inset-0 rounded-[22px] shadow-[inset_0_0_26px_rgba(28,167,166,0.2)] pointer-events-none" />

          <div className="absolute inset-x-0 bottom-0 z-10 p-4 flex items-end justify-between">
            <div className="max-w-[62%]">
              <motion.h3
                key={`${slides[currentIndex].id}-title`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="text-white text-[16px] md:text-[18px] font-bold tracking-wide"
              >
                {slides[currentIndex].title}
              </motion.h3>
              <motion.p
                key={`${slides[currentIndex].id}-desc`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 0.92, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="text-white/80 text-[11px] md:text-[12px] mt-1 leading-snug"
              >
                {slides[currentIndex].desc}
              </motion.p>
            </div>

            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.05, boxShadow: '0 10px 24px rgba(255,107,87,0.52)' }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 340, damping: 20 }}
              className="px-5 py-2.5 rounded-full text-white text-[11px] font-bold tracking-wide"
              style={{
                background: 'linear-gradient(135deg, #ff7a5c, #ff4e3a)',
                boxShadow: '0 8px 18px rgba(255,107,87,0.42)',
              }}
            >
              BENGALI FISH
            </motion.button>
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {slides.map((_, idx) => (
              <motion.div
                key={idx}
                className={`h-1.5 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/35'}`}
                animate={{ width: idx === currentIndex ? 16 : 6 }}
                transition={{ duration: 0.24 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
