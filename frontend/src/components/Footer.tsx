import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Footer() {
    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <footer className="bg-[#003366] text-white pt-12 pb-24 md:pb-12 border-t-[3px] border-[#009999] relative z-40 w-full">
            <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

                    {/* Section 1 - Brand Overview */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5 }}
                        variants={sectionVariants}
                        className="flex flex-col gap-4"
                    >
                        <div>
                            <h2 className="text-[26px] font-extrabold tracking-tight text-white mb-0.5">Zeto Mart</h2>
                            <p className="text-[#009999] text-[13px] font-bold tracking-wide uppercase">Premium Fresh Seafood Delivered Hygienically</p>
                        </div>
                        <div className="h-[2px] w-12 bg-[#009999]/60 rounded-full" />
                        <p className="text-white/70 text-sm leading-relaxed pr-4">
                            Delivering farm-fresh and deep-sea seafood with premium quality standards and cold-chain assurance.
                        </p>
                        <div className="flex gap-3 mt-1">
                            {/* Social Placeholders */}
                            {['Facebook', 'Twitter', 'Instagram'].map((social) => (
                                <motion.a
                                    key={social}
                                    href="#"
                                    whileHover={{ scale: 1.1 }}
                                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#009999] hover:bg-[#FF6F61] hover:text-white hover:border-[#FF6F61] transition-all duration-300"
                                    aria-label={social}
                                >
                                    <div className="w-3.5 h-3.5 rounded-sm border-2 border-current opacity-90" />
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Section 2 - Company Details */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        variants={sectionVariants}
                        className="flex flex-col gap-4"
                    >
                        <h3 className="text-lg font-bold text-white relative inline-block pb-3">
                            Company Information
                            <span className="absolute bottom-0 left-0 w-8 h-[2px] bg-[#FF6F61] rounded-full" />
                        </h3>
                        <div className="flex flex-col gap-3 text-sm text-white/70 mt-1">
                            <div>
                                <strong className="text-white/90 block font-semibold mb-1">ACQACORAL DELICACIES PRIVATE LIMITED</strong>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[#009999] text-xs font-semibold uppercase tracking-wider">Registered Address:</span>
                                <span className="leading-relaxed text-[13px]">No 203/1 Kannuru Village<br />Bangalore, Karnataka – 560077</span>
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                                <span className="text-[#009999] text-xs font-semibold uppercase tracking-wider">GST Number:</span>
                                <span className="text-[13px]">GST: Will be updated</span>
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                                <span className="text-[#009999] text-xs font-semibold uppercase tracking-wider">Authorized Signatory:</span>
                                <span className="text-[13px]">Melwin Mathias – Founder</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Section 3 - Contact Info */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        variants={sectionVariants}
                        className="flex flex-col gap-4"
                    >
                        <h3 className="text-lg font-bold text-white relative inline-block pb-3">
                            Contact Us
                            <span className="absolute bottom-0 left-0 w-8 h-[2px] bg-[#FF6F61] rounded-full" />
                        </h3>
                        <div className="flex flex-col gap-5 text-sm text-white/70 mt-1">
                            <a href="mailto:Contact@inorfresh.com" className="flex items-start gap-3.5 group">
                                <div className="mt-0.5 text-[#009999] group-hover:text-[#FF6F61] transition-colors duration-300">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white/50 text-xs font-medium uppercase tracking-wider mb-0.5">Official Email:</span>
                                    <span className="text-white font-medium group-hover:text-[#FF6F61] transition-colors relative inline-block text-[14px]">
                                        Contact@inorfresh.com
                                        <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-[#FF6F61] transition-all duration-300 group-hover:w-full rounded-full" />
                                    </span>
                                </div>
                            </a>
                            <a href="tel:8425969017" className="flex items-start gap-3.5 group">
                                <div className="mt-0.5 text-[#009999] group-hover:text-[#FF6F61] transition-colors duration-300">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white/50 text-xs font-medium uppercase tracking-wider mb-0.5">Contact Numbers:</span>
                                    <span className="text-white font-medium group-hover:text-[#FF6F61] transition-colors relative inline-block text-[14px]">
                                        8425969017
                                        <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-[#FF6F61] transition-all duration-300 group-hover:w-full rounded-full" />
                                    </span>
                                </div>
                            </a>
                        </div>
                    </motion.div>

                    {/* Section 4 - Quick Links */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        variants={sectionVariants}
                        className="flex flex-col gap-4"
                    >
                        <h3 className="text-lg font-bold text-white relative inline-block pb-3">
                            Quick Links
                            <span className="absolute bottom-0 left-0 w-8 h-[2px] bg-[#FF6F61] rounded-full" />
                        </h3>
                        <nav className="flex flex-col gap-2.5 mt-1">
                            {[
                                { name: 'Home', path: '/' },
                                { name: 'Categories', path: '/categories' },
                                { name: 'Orders', path: '/orders' },
                                { name: 'Profile', path: '/account' },
                                { name: 'Terms & Conditions', path: '/terms' },
                                { name: 'Privacy Policy', path: '/privacy' },
                                { name: 'Refund Policy', path: '/refund' },
                            ].map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className="text-[13px] font-medium text-white/70 hover:text-white transition-colors duration-200 block w-fit relative group py-0.5"
                                >
                                    {link.name}
                                    <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-[#FF6F61] transition-all duration-300 group-hover:w-full" />
                                </Link>
                            ))}
                        </nav>
                    </motion.div>

                </div>
            </div>

            {/* Bottom Sub-Footer Bar */}
            <div className="mt-14 border-t border-white/10 pt-6 px-4 md:px-6 lg:px-8 max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] font-medium tracking-wide text-white/50">
                <p>© 2026 Zeto Mart. All rights reserved.</p>
                <p className="text-center md:text-right">Designed & Developed for <span className="text-white/70">ACQACORAL DELICACIES PRIVATE LIMITED</span></p>
            </div>
        </footer>
    );
}
