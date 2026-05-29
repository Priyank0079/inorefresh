import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getIconByName } from "../../../utils/iconLibrary";

interface ExploreCardProps {
    id: string;
    name: string;
    image?: string;
    iconName?: string;
    link: string;
    index: number;
    compact?: boolean;
}

const ExploreCard: React.FC<ExploreCardProps> = ({ id, name, image, iconName, link, index, compact = false }) => {
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(link);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
            whileHover={{
                y: compact ? -4 : -8,
                transition: { duration: 0.2 }
            }}
            onClick={handleClick}
            className="relative h-full cursor-pointer group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleClick(e as any);
                }
            }}
        >
                <div className={`relative overflow-hidden ${compact ? 'rounded-[20px]' : 'rounded-[24px]'} bg-white backdrop-blur-md border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 h-full`}>
                    {/* Decorative Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1CA7C7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Glass Overlay for Depth */}
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                    {/* Icon/Image Container */}
                    <div className="relative aspect-square flex items-center justify-center overflow-hidden">
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* Background Glow - only visible for icons or transparent images */}
                            <div className="absolute inset-0 bg-[#6FD3FF]/20 blur-[30px] rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />

                            {image ? (
                                <img
                                    src={image}
                                    alt={name}
                                    className="w-full h-full object-cover relative z-10 transition-transform duration-500 group-hover:scale-110"
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                            parent.innerHTML = `<div class="${compact ? 'text-2xl' : 'text-4xl'} font-bold text-[#072F4A]/10">${name.charAt(0)}</div>`;
                                        }
                                    }}
                                />
                            ) : iconName ? (
                                <div className={`text-[#072F4A] transition-transform duration-500 group-hover:scale-110 transform-gpu relative z-10 ${compact ? 'p-4' : 'p-8'}`}>
                                    {React.cloneElement(getIconByName(iconName) as React.ReactElement, {
                                        width: "100%",
                                        height: "100%",
                                        className: compact ? "w-10 h-10" : "w-16 h-16 sm:w-20 sm:h-20"
                                    })}
                                </div>
                            ) : (
                                <div className={`${compact ? 'text-2xl' : 'text-4xl'} font-bold text-[#072F4A]/10 relative z-10`}>
                                    {name.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className={`${compact ? 'p-3' : 'p-4'} text-center relative z-10`}>
                        <h3 className={`text-[#072F4A] font-bold ${compact ? 'text-[12px]' : 'text-[14px] sm:text-[16px]'} leading-tight group-hover:text-[#1CA7C7] transition-colors duration-300 line-clamp-1`}>
                            {name}
                        </h3>

                        {/* Minimal "Explore" indicator that appears on hover */}
                        {!compact && (
                            <div className="mt-2 flex justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#1CA7C7]">Explore →</span>
                            </div>
                        )}
                    </div>
                </div>
        </motion.div>
    );
};

export default ExploreCard;
