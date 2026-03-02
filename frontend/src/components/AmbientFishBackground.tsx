import React from 'react';
import { motion } from 'framer-motion';

// Minimal, elegant SVGs for different fish varieties
const FISH_SILHOUETTES = [
    // Tuna (Sleek, fast profile)
    <svg key="tuna" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10,20 C30,5 60,8 80,15 C90,18 95,20 95,20 C95,20 85,30 90,38 C80,32 50,35 10,20 Z" />
        <path d="M30,10 C35,5 40,2 45,5" />
        <path d="M40,30 C45,35 50,38 55,35" />
        <path d="M80,15 C85,15 90,10 95,5 C95,5 92,12 95,20" />
        <path d="M80,25 C85,25 90,30 95,35 C95,35 92,28 95,20" />
        <path d="M25,20 C30,22 35,22 40,20" />
    </svg>,

    // Salmon (Thicker, powerful profile)
    <svg key="salmon" viewBox="0 0 100 45" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5,22 C25,5 55,5 80,18 C90,22 95,22 95,22 C95,22 88,32 92,42 C78,35 55,40 5,22 Z" />
        <path d="M40,9 C45,3 55,2 60,6" />
        <path d="M35,35 C45,42 55,42 60,38" />
        <path d="M20,22 C25,25 30,25 35,22" />
    </svg>,

    // King Fish (Long, narrow, sharp)
    <svg key="kingfish" viewBox="0 0 120 30" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5,15 C30,8 70,8 100,12 C110,14 115,15 115,15 C115,15 110,22 115,28 C100,22 70,25 5,15 Z" />
        <path d="M50,10 C55,5 65,5 70,8" />
        <path d="M60,20 C65,25 75,25 80,22" />
        <path d="M30,15 C35,17 40,17 45,15" />
    </svg>,

    // Pomfret (Tall, flat, rounded)
    <svg key="pomfret" viewBox="0 0 80 60" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10,30 C30,5 55,5 65,25 C70,30 75,30 75,30 C75,30 70,45 75,55 C60,45 30,55 10,30 Z" />
        <path d="M35,12 C40,5 50,5 55,15" />
        <path d="M35,48 C40,55 50,55 55,45" />
        <path d="M20,30 C25,33 30,33 35,30" />
    </svg>,

    // Small Schooling Fish
    <svg key="smallfish" viewBox="0 0 60 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5,10 C20,2 40,5 50,8 C55,9 58,10 58,10 C58,10 52,15 55,18 C45,15 25,18 5,10 Z" />
        <path d="M30,5 C35,2 40,2 45,4" />
        <path d="M25,15 C30,18 35,18 40,16" />
    </svg>
];

interface FishProps {
    svgIndex: number;
    layer: 1 | 2 | 3;
    startX: string;
    endX: string;
    startY: string;
    duration: number;
    delay: number;
    scale: number;
    flip?: boolean;
}

const FishAnimation = ({ svgIndex, layer, startX, endX, startY, duration, delay, scale, flip }: FishProps) => {
    // Layer definitions for depth mapping
    const layerConfig = {
        1: { opacity: 0.04, className: 'text-[#009999]' }, // Background: Largest, faintest
        2: { opacity: 0.06, className: 'text-[#009999]' }, // Midground: Medium
        3: { opacity: 0.08, className: 'text-[#00E0C6]' }, // Foreground: Smallest, sharpest (tinted aqua)
    };

    const config = layerConfig[layer];

    return (
        <motion.div
            className={`absolute pointer-events-none will-change-transform z-0 ${config.className}`}
            style={{
                width: `${scale * 100}px`,
                opacity: config.opacity,
                top: startY,
                left: startX,
            }}
            initial={{ x: "0vw", y: 0, opacity: 0, rotate: flip ? 180 : 0 }}
            animate={{
                x: ["0vw", endX],
                y: [0, -20, 15, -10, 0], // Gentle vertical bobbing
                opacity: [0, config.opacity, config.opacity, 0], // Fade in and out
                rotate: flip ? [180, 182, 178, 180] : [0, 2, -2, 0] // Gentle pitch/tilt
            }}
            transition={{
                x: {
                    duration: duration,
                    ease: "linear",
                    repeat: Infinity,
                    delay: delay,
                },
                y: {
                    duration: duration * 0.8,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: delay,
                },
                opacity: {
                    duration: duration,
                    ease: "linear",
                    repeat: Infinity,
                    delay: delay,
                },
                rotate: {
                    duration: duration * 0.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: delay,
                }
            }}
        >
            {FISH_SILHOUETTES[svgIndex % FISH_SILHOUETTES.length]}
        </motion.div>
    );
};

export default function AmbientFishBackground() {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Reduce fish count on mobile for performance (UX Rule: Keep performance optimized)
    const fishData = isMobile ? [
        // LAYER 1: Deep background (Slow, faint)
        { id: 1, svg: 0, layer: 1 as const, startX: '-20%', endX: '120vw', startY: '15%', duration: 40, delay: 0, scale: 2.5 },
        { id: 2, svg: 2, layer: 1 as const, startX: '120%', endX: '-120vw', startY: '60%', duration: 45, delay: 5, scale: 2.2, flip: true },

        // LAYER 2: Midground
        { id: 3, svg: 1, layer: 2 as const, startX: '-10%', endX: '120vw', startY: '35%', duration: 30, delay: 2, scale: 1.5 },
        { id: 4, svg: 3, layer: 2 as const, startX: '110%', endX: '-120vw', startY: '80%', duration: 35, delay: 12, scale: 1.2, flip: true },

        // LAYER 3: Foreground (Small schooling fish)
        { id: 5, svg: 4, layer: 3 as const, startX: '-5%', endX: '120vw', startY: '45%', duration: 20, delay: 1, scale: 0.8 },
    ] : [
        // LAYER 1: Deep background
        { id: 1, svg: 0, layer: 1 as const, startX: '-10%', endX: '120vw', startY: '10%', duration: 45, delay: 0, scale: 3 },
        { id: 2, svg: 2, layer: 1 as const, startX: '110%', endX: '-120vw', startY: '40%', duration: 55, delay: 15, scale: 2.5, flip: true },
        { id: 3, svg: 3, layer: 1 as const, startX: '-15%', endX: '120vw', startY: '75%', duration: 40, delay: 8, scale: 2.8 },

        // LAYER 2: Midground
        { id: 4, svg: 1, layer: 2 as const, startX: '-5%', endX: '120vw', startY: '25%', duration: 35, delay: 2, scale: 1.8 },
        { id: 5, svg: 0, layer: 2 as const, startX: '105%', endX: '-120vw', startY: '60%', duration: 38, delay: 10, scale: 1.5, flip: true },
        { id: 6, svg: 2, layer: 2 as const, startX: '-10%', endX: '120vw', startY: '85%', duration: 42, delay: 5, scale: 1.6 },

        // LAYER 3: Foreground (Faster, smallest)
        { id: 7, svg: 4, layer: 3 as const, startX: '-5%', endX: '120vw', startY: '18%', duration: 25, delay: 0, scale: 0.9 },
        // Schooling effect
        { id: 8, svg: 4, layer: 3 as const, startX: '-5%', endX: '120vw', startY: '20%', duration: 25, delay: 0.5, scale: 0.8 },
        { id: 9, svg: 4, layer: 3 as const, startX: '-5%', endX: '120vw', startY: '17%', duration: 25, delay: 1.1, scale: 0.85 },

        { id: 10, svg: 4, layer: 3 as const, startX: '105%', endX: '-120vw', startY: '50%', duration: 30, delay: 12, scale: 1, flip: true },
    ];

    return (
        <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden" aria-hidden="true">
            {fishData.map((fish) => (
                <FishAnimation
                    key={fish.id}
                    svgIndex={fish.svg}
                    layer={fish.layer}
                    startX={fish.startX}
                    endX={fish.endX}
                    startY={fish.startY}
                    duration={fish.duration}
                    delay={fish.delay}
                    scale={fish.scale}
                    flip={fish.flip}
                />
            ))}
        </div>
    );
}
