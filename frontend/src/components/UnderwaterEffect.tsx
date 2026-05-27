import { useMemo } from 'react';
import { motion } from 'framer-motion';

// Seeded random values so positions never shift on re-render (fixes CLS)
const PARTICLE_DATA = [
    { w: 14, h: 10, color: '#00ffff', opacity: 0.08, left: 12, top: 8,  yAnim: 35, xAnim: 10,  dur: 14, delay: 0   },
    { w: 8,  h: 14, color: '#00e0c6', opacity: 0.07, left: 28, top: 55, yAnim: 25, xAnim: -8,  dur: 18, delay: 2.5 },
    { w: 16, h: 8,  color: '#00ffff', opacity: 0.09, left: 45, top: 20, yAnim: 40, xAnim: 12,  dur: 12, delay: 1   },
    { w: 10, h: 16, color: '#00e0c6', opacity: 0.06, left: 62, top: 72, yAnim: 30, xAnim: -14, dur: 20, delay: 4   },
    { w: 12, h: 12, color: '#00ffff', opacity: 0.08, left: 78, top: 38, yAnim: 38, xAnim: 8,   dur: 16, delay: 3   },
    { w: 7,  h: 11, color: '#00e0c6', opacity: 0.07, left: 90, top: 15, yAnim: 22, xAnim: -10, dur: 22, delay: 6   },
    { w: 15, h: 9,  color: '#00ffff', opacity: 0.09, left: 5,  top: 85, yAnim: 32, xAnim: 15,  dur: 13, delay: 1.5 },
    { w: 9,  h: 13, color: '#00e0c6', opacity: 0.06, left: 35, top: 42, yAnim: 28, xAnim: -6,  dur: 19, delay: 5   },
    // Desktop-only extras (indices 8+)
    { w: 11, h: 11, color: '#00ffff', opacity: 0.07, left: 52, top: 60, yAnim: 36, xAnim: 11,  dur: 15, delay: 2   },
    { w: 13, h: 8,  color: '#00e0c6', opacity: 0.08, left: 70, top: 90, yAnim: 26, xAnim: -12, dur: 17, delay: 7   },
    { w: 8,  h: 15, color: '#00ffff', opacity: 0.06, left: 82, top: 48, yAnim: 34, xAnim: 9,   dur: 21, delay: 3.5 },
    { w: 14, h: 10, color: '#00e0c6', opacity: 0.07, left: 22, top: 30, yAnim: 30, xAnim: -7,  dur: 14, delay: 8   },
    { w: 10, h: 14, color: '#00ffff', opacity: 0.09, left: 40, top: 78, yAnim: 38, xAnim: 13,  dur: 16, delay: 0.5 },
    { w: 7,  h: 10, color: '#00e0c6', opacity: 0.06, left: 58, top: 5,  yAnim: 24, xAnim: -9,  dur: 23, delay: 9   },
    { w: 12, h: 12, color: '#00ffff', opacity: 0.08, left: 95, top: 65, yAnim: 40, xAnim: 14,  dur: 12, delay: 4.5 },
];

export const UnderwaterEffect = () => {
    // Determine mobile once; stable value avoids re-render thrash
    const isMobile = useMemo(
        () => typeof window !== 'undefined' && window.innerWidth < 768,
        []
    );

    // Slice particle list: 8 on mobile, 15 on desktop — count is stable
    const particles = useMemo(
        () => PARTICLE_DATA.slice(0, isMobile ? 8 : 15),
        [isMobile]
    );

    return (
        // contain:strict — browser isolates this layer, skips layout pass
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none" style={{ contain: 'strict' }}>
            {/* 1️⃣ Light Caustic Overlay - uses contain:strict so it never triggers layout */}
            <motion.div
                className="absolute inset-0 opacity-[0.06] mix-blend-soft-light"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    backgroundSize: '800px 800px',
                    filter: 'blur(20px) contrast(150%) brightness(120%)',
                    contain: 'strict',
                    willChange: 'transform',
                }}
                animate={{
                    backgroundPosition: ['0% 0%', '10% 10%', '0% 0%'],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* 2️⃣ Floating Light Particles - pre-computed positions (no Math.random in render) */}
            {particles.map((p, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        width: p.w + 'px',
                        height: p.h + 'px',
                        backgroundColor: p.color,
                        opacity: p.opacity,
                        filter: 'blur(8px)',
                        left: p.left + '%',
                        top: p.top + '%',
                        willChange: 'transform',
                        contain: 'layout style',
                    }}
                    animate={{
                        y: [0, -p.yAnim, 0],
                        x: [0, p.xAnim, 0],
                        opacity: [p.opacity, p.opacity * 2, p.opacity],
                    }}
                    transition={{
                        duration: p.dur,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: p.delay,
                    }}
                />
            ))}

            {/* 3️⃣ Soft Ambient Glow - static, no animation (pure CSS) */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.08]"
                style={{
                    background: 'radial-gradient(circle at 70% 30%, rgba(0, 224, 198, 0.4) 0%, transparent 60%)'
                }}
            />
        </div>
    );
};
