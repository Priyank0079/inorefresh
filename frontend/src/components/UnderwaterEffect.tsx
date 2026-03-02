import { motion } from 'framer-motion';

export const UnderwaterEffect = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
            {/* 1️⃣ Light Caustic Overlay - Soft Swimming Pool Reflections */}
            <motion.div
                className="absolute inset-0 opacity-[0.06] mix-blend-soft-light"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    backgroundSize: '800px 800px',
                    filter: 'blur(20px) contrast(150%) brightness(120%)',
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

            {/* 2️⃣ Floating Light Particles - Sparsely Distributed */}
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        width: Math.random() * 12 + 6 + 'px',
                        height: Math.random() * 12 + 6 + 'px',
                        backgroundColor: i % 2 === 0 ? '#00ffff' : '#00e0c6',
                        opacity: Math.random() * 0.06 + 0.06,
                        filter: 'blur(8px)',
                        left: Math.random() * 100 + '%',
                        top: Math.random() * 100 + '%',
                    }}
                    animate={{
                        y: [0, -40, 0],
                        x: [0, Math.random() * 30 - 15, 0],
                        opacity: [0.06, 0.12, 0.06],
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: Math.random() * 10,
                    }}
                />
            ))}

            {/* 3️⃣ Soft Ambient Glow - Radial Highlight */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.08]"
                style={{
                    background: 'radial-gradient(circle at 70% 30%, rgba(0, 224, 198, 0.4) 0%, transparent 60%)'
                }}
            />
        </div>
    );
};
