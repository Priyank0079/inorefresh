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
      <div
        className="relative w-full h-[95vh] bg-cover bg-center flex items-center px-5 md:px-[100px]"
        style={{
          backgroundImage: `url('${HERO_IMAGE}')`,
          backgroundAttachment: 'fixed'
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

          {/* 🐟 Right Side: Fish Image (Floating) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="hidden md:flex justify-center relative h-[500px]"
          >
            <motion.img
              src="/images/bluefin_tuna.png"
              alt="Floating Fish"
              className="w-full h-full object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
              animate={{
                y: [0, -15, 0],
                rotate: [0, 2, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Subtle glow behind fish */}
            <div className="absolute inset-0 bg-white/5 rounded-full blur-[100px] pointer-events-none -z-10" />
          </motion.div>

        </div>
      </div>
    </div>
  );
}
