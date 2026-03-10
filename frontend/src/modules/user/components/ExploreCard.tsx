import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { getIconByName } from "../../../utils/iconLibrary";

interface ExploreCardProps {
    id: string;
    name: string;
    image?: string;
    iconName?: string;
    link: string;
    index: number;
}

const ExploreCard: React.FC<ExploreCardProps> = ({ id, name, image, iconName, link, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
            whileHover={{
                y: -8,
                transition: { duration: 0.2 }
            }}
            className="relative"
        >
            <Link to={link} className="block group">
                <div className="relative overflow-hidden rounded-[24px] bg-white backdrop-blur-md border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 h-full">
                    {/* Decorative Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1CA7C7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Glass Overlay for Depth */}
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                    {/* Icon/Image Container */}
                    <div className="relative aspect-square flex items-center justify-center p-6 sm:p-8">
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* Background Glow */}
                            <div className="absolute inset-0 bg-[#6FD3FF]/20 blur-[30px] rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />

                            {image ? (
                                <img
                                    src={image}
                                    alt={name}
                                    className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_8px_16px_rgba(0,0,0,0.1)]"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                            parent.innerHTML = `<div class="text-4xl font-bold text-[#072F4A]/10">${name.charAt(0)}</div>`;
                                        }
                                    }}
                                />
                            ) : iconName ? (
                                <div className="text-[#072F4A] transition-transform duration-500 group-hover:scale-110 transform-gpu relative z-10">
                                    {React.cloneElement(getIconByName(iconName) as React.ReactElement, {
                                        width: "100%",
                                        height: "100%",
                                        className: "w-16 h-16 sm:w-20 sm:h-20"
                                    })}
                                </div>
                            ) : (
                                <div className="text-4xl font-bold text-[#072F4A]/10 relative z-10">
                                    {name.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="p-4 pt-0 text-center relative z-10">
                        <h3 className="text-[#072F4A] font-bold text-[14px] sm:text-[16px] leading-tight group-hover:text-[#1CA7C7] transition-colors duration-300">
                            {name}
                        </h3>

                        {/* Minimal "Explore" indicator that appears on hover */}
                        <div className="mt-2 flex justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#1CA7C7]">Explore →</span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default ExploreCard;
