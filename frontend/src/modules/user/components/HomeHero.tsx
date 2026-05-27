import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface HomeHeroProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export default function HomeHero({ activeTab = 'all', onTabChange }: HomeHeroProps) {
  const navigate = useNavigate();

  const HERO_IMAGE = "/images/ocean_hero_background.png";

  const handleShopNow = () => {
    onTabChange?.('all');
    const section = document.getElementById('category-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative w-full overflow-hidden font-sans">
      {/* 🌊 HERO SECTION */}
      {/*
        backgroundAttachment:'fixed' is intentionally removed — it disables GPU
        compositing on mobile (Chrome/Safari both repaint the whole viewport on
        every scroll frame), causing INP > 200 ms and layout shifts.
        The parallax feel is preserved via the tall section height (95vh).
      */}
      <div
        className="relative w-full h-[95vh] bg-cover bg-center flex items-center px-5 md:px-[100px]"
        style={{
          backgroundImage: `url('${HERO_IMAGE}')`,
          willChange: 'transform',
        }}
      >
        {/* Overlay Gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(7,47,74,0.92) 0%, rgba(11,60,93,0.8) 45%, rgba(28,167,199,0.1) 100%)'
          }}
        />

        {/* Hero Content Wrapper */}
        <div className="relative z-20 grid md:grid-cols-2 w-full max-w-[1440px] mx-auto items-center gap-12 pt-[100px]">

          {/* 📝 Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center md:text-left"
          >
            <h1
              className="text-white text-5xl md:text-[88px] font-[800] leading-[1.1] mb-6 tracking-[1px] uppercase"
            >
              FRESH FROM<br />
              THE <span
                className="bg-clip-text text-transparent bg-gradient-to-r from-[#6FD3FF] to-[#1CA7C7]"
              >OCEAN</span>
            </h1>

            <p className="text-[#D6E6F2] text-lg md:text-[18px] font-medium max-w-[550px] mb-12 leading-[1.6] opacity-90 mt-[20px]">
              Premium seafood delivered straight from<br />
              deep waters to your doorstep.
            </p>

            <motion.button
              whileHover={{
                y: -4,
                background: 'linear-gradient(135deg, #6FD3FF, #1CA7C7)',
                boxShadow: '0 15px 35px rgba(28,167,199,0.6)'
              }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShopNow}
              className="px-12 py-5 rounded-full text-white font-semibold text-lg tracking-[1px] shadow-[0_8px_25px_rgba(28,167,199,0.4)] transition-all duration-300 uppercase border-none"
              style={{ background: 'linear-gradient(135deg, #1CA7C7, #0F4C75)' }}
            >
              EXPLORE DEPTH
            </motion.button>
          </motion.div>

          {/* 🐟 Right Side: Empty for a cleaner minimalist look */}
          <div className="hidden md:block" />

        </div>
      </div>
    </div>
  );
}
