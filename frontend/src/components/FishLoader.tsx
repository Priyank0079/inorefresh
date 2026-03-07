import React, { useState, useEffect, useRef } from 'react';

/**
 * FishLoader - A premium, lightweight fish-themed animated loader.
 * Refactored to use requestAnimationFrame for smoother state transitions and lower CPU usage.
 */
const FishLoader: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const lastUpdateRef = useRef<number>(0);
    const requestRef = useRef<number>(0);

    const animate = (time: number) => {
        if (lastUpdateRef.current === 0) lastUpdateRef.current = time;
        const deltaTime = time - lastUpdateRef.current;

        if (deltaTime >= 500) {
            setActiveIndex((prev) => (prev + 1) % 3);
            lastUpdateRef.current = time;
        }
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    // Minimal Fish SVG Path - Facing Right
    const fishPath = "M2,7C2,7,5,2,12,2C19,2,22,7,22,7C22,7,19,12,12,12C5,12,2,7,2,7ZM24,3L21,7L24,11V3ZM16,7C16,6.45,15.55,6,15,6C14.45,6,14,6.45,14,7C14,7.55,14.45,8,15,8C15.55,8,16,7.55,16,7Z";

    return (
        <div className="flex items-center justify-center w-full h-full min-h-[200px] py-12 animate-in fade-in duration-500">
            <div className="flex items-center gap-6">
                {[0, 1, 2].map((index) => (
                    <div
                        key={index}
                        className={`transition-all duration-300 ease-in-out flex items-center justify-center
                            ${activeIndex === index ? 'scale-110' : 'scale-100 opacity-60'}
                        `}
                        style={{
                            animation: `fish-swim 1s ease-in-out infinite`,
                            animationDelay: `${index * 0.2}s`,
                        }}
                    >
                        <svg
                            width="48"
                            height="28"
                            viewBox="0 0 24 14"
                            className={`transition-all duration-300
                                ${activeIndex === index
                                    ? 'text-[#6FD3FF] drop-shadow-[0_0_8px_rgba(111,211,255,0.5)]'
                                    : 'text-[#003366]'
                                }
                            `}
                        >
                            <path
                                d={fishPath}
                                fill="currentColor"
                                className="transition-all duration-300"
                            />
                        </svg>
                    </div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fish-swim {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }

                @keyframes fish-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}} />
        </div>
    );
};

export default FishLoader;
