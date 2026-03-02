import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
    {
        id: 'aqua',
        title: 'Aqua Fish',
        desc: 'Bright silver-blue tone & Clean marine look',
        image: '/images/aqua_fish.png',
    },
    {
        id: 'marin',
        title: 'Marin Fish',
        desc: 'Darker ocean tone & luxury vibe',
        image: '/images/marin_fish.png',
    },
    {
        id: 'bengali',
        title: 'Bengali Fish',
        desc: 'Traditional freshwater fish look',
        image: '/images/bengali_fish.png',
    },
];

const CausticsAndIce = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Soft floating Ice Cubes & Bubbles */}
        {[...Array(12)].map((_, i) => {
            const isIce = i % 3 === 0;
            return (
                <motion.div
                    key={i}
                    className={`absolute ${isIce ? 'bg-white/30 backdrop-blur-md rounded-md shadow-[inset_0_0_10px_rgba(255,255,255,0.8)] border border-white/40' : 'rounded-full bg-white/20 backdrop-blur-sm shadow-[0_0_8px_rgba(255,255,255,0.4)]'}`}
                    style={{
                        width: isIce ? Math.random() * 20 + 15 + 'px' : Math.random() * 12 + 4 + 'px',
                        height: isIce ? Math.random() * 20 + 15 + 'px' : Math.random() * 12 + 4 + 'px',
                        left: Math.random() * 100 + '%',
                        bottom: '-30px',
                    }}
                    animate={{
                        y: [0, -300],
                        x: [0, Math.random() * 30 - 15],
                        opacity: [0, 0.9, 0],
                        rotate: isIce ? [0, Math.random() * 180 - 90] : 0,
                    }}
                    transition={{
                        duration: Math.random() * 6 + 5,
                        repeat: Infinity,
                        ease: 'linear',
                        delay: Math.random() * 5,
                    }}
                />
            );
        })}
        {/* Overlay Caustic Lighting Moving effect */}
        <motion.div
            className="absolute inset-0 mix-blend-overlay opacity-40"
            style={{
                backgroundImage: 'radial-gradient(circle at 50% 0%, #ffffff 0%, transparent 60%)',
            }}
            animate={{
                x: [-20, 20, -20],
                opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut'
            }}
        />
    </div>
);

export default function FishCarouselBanner() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 4000); // 4 seconds per slide
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full px-4 pt-2 pb-0 mb-2">
            <div className="relative p-[3px] rounded-[18px] overflow-hidden shadow-2xl flex items-center justify-center">
                {/* Animated Gradient Border Layer */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        background: 'linear-gradient(90deg, #003366, #009999, #FF6F61, #003366)',
                        backgroundSize: '300% 100%',
                        animation: 'gradientShift 3s linear infinite'
                    }}
                ></div>
                <style>{`
                    @keyframes gradientShift {
                        0% { background-position: 0% 0; }
                        100% { background-position: -300% 0; }
                    }
                `}</style>

                <div
                    className="relative w-full rounded-2xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#003366] to-[#009999] z-10"
                    style={{ aspectRatio: '16/9', maxHeight: '250px' }}
                >
                    {/* Fish Slides - Z-0 Background */}
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none rounded-2xl z-0 shadow-[inset_0_0_40px_rgba(0,153,153,0.3)] ring-1 ring-[#009999]/30">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                            >
                                {/* The Full Background Fish Image with Parallax & Subtleties */}
                                <motion.div
                                    className="w-full h-full relative flex items-center justify-center"
                                    animate={{
                                        y: [-2, 2, -2] // Micro water ripple / vertical drift
                                    }}
                                    transition={{
                                        duration: 3 + (currentIndex % 2),
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <motion.img
                                        src={slides[currentIndex].image}
                                        alt={slides[currentIndex].title}
                                        className="absolute w-full h-full object-cover z-10"
                                        animate={{
                                            scale: [1.02, 1.06, 1.02],
                                            rotateZ: [-1, 1, -1],
                                            filter: [
                                                'brightness(1) contrast(1.05)',
                                                'brightness(1.1) contrast(1.1)',
                                                'brightness(1) contrast(1.05)'
                                            ],
                                        }}
                                        transition={{
                                            duration: 4, repeat: Infinity, ease: "easeInOut"
                                        }}
                                    />
                                    {/* Glass Reflection overlay */}
                                    <div className="absolute z-20 inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-2xl mix-blend-overlay pointer-events-none"></div>
                                </motion.div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Enhancements layer on top of fish */}
                    <div className="absolute inset-0 bg-radial-gradient from-white/10 via-transparent to-black/20 pointer-events-none mix-blend-overlay z-10"></div>
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none z-10"></div>
                    <div className="z-10 absolute inset-0"><CausticsAndIce /></div>

                    {/* Text Overlay & Typography - Absolute Bottom-Right, Highest Z-Index */}
                    <div className="absolute z-20 inset-0 p-3 flex flex-col justify-end pointer-events-none">
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="self-end mb-4 mr-1"
                            >
                                <div className="px-5 py-2 rounded-full bg-[#FF6F61] shadow-[0_4px_15px_rgba(255,111,97,0.6)] border border-white/20 backdrop-blur-md text-white font-bold text-[11px] uppercase tracking-wider relative overflow-hidden group">
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full"
                                        animate={{ x: ['-100%', '200%'] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                                    />
                                    <span className="relative z-10 drop-shadow-md">{slides[currentIndex].title}</span>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Carousel Indicators */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {slides.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/40'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
