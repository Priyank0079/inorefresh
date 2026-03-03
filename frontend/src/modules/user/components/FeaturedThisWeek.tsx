import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getProducts } from '../../../services/api/customerProductService';

interface FeaturedCard {
  id: string;
  type: 'newly-launched' | 'price-drop' | 'plum-cakes' | 'featured';
  title?: string;
  categoryId?: string;
  bgColor: string;
  borderColor: string;
}

const featuredCards: FeaturedCard[] = [
  {
    id: 'newly-launched',
    type: 'newly-launched',
    bgColor: 'bg-[#e0efff]',
    borderColor: 'border-[#b8daff]',
  },
  {
    id: 'price-drop',
    type: 'price-drop',
    title: 'PRICE DROP',
    bgColor: 'bg-[#003366]',
    borderColor: 'border-[#004c80]',
  },
  {
    id: 'plum-cakes',
    type: 'plum-cakes',
    title: 'Plum Cakes',
    bgColor: 'bg-[#FF6F61]',
    borderColor: 'border-white',
  },
  {
    id: 'fresh-arrivals',
    type: 'featured',
    title: 'Fresh Arrivals',
    categoryId: 'fruits-veg',
    bgColor: 'bg-[#009999]',
    borderColor: 'border-[#4dc3c3]',
  },
];

export default function FeaturedThisWeek() {
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [newlyLaunchedProducts, setNewlyLaunchedProducts] = useState<any[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await getProducts({ limit: 6 });
        if (res.success && res.data) {
          setNewlyLaunchedProducts(res.data);
        }
      } catch (e) {
        console.error(e);
        const fruitList = [
          { id: '1', name: 'Papaya', emoji: '🥭' },
          { id: '2', name: 'Apple', emoji: '🍎' },
          { id: '3', name: 'Banana', emoji: '🍌' },
          { id: '4', name: 'Mango', emoji: '🥭' },
          { id: '5', name: 'Orange', emoji: '🍊' },
          { id: '6', name: 'Guava', emoji: '🍈' },
        ];
        setNewlyLaunchedProducts(fruitList);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (newlyLaunchedProducts.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentProductIndex((prev) => (prev + 1) % newlyLaunchedProducts.length);
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [newlyLaunchedProducts.length]);

  return (
    <div className="mb-12 mt-8">
      <h2 className="text-[28px] font-black text-white mb-6 px-6 tracking-tight uppercase" style={{ textShadow: '0 0 20px rgba(28,167,199,0.3)' }}>
        Featured <span className="text-[#1CA7C7]">This Week</span>
      </h2>
      <div className="px-6">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6 scroll-smooth">
          {/* Newly Launched */}
          <div className="flex-shrink-0 w-[140px]">
            <div className="water-card water-shimmer-border rounded-[24px] overflow-hidden relative h-56 shadow-2xl transition-all hover:-translate-y-1">
              <div className="absolute top-0 left-0 right-0 z-20">
                <div className="bg-gradient-to-r from-[#072F4A] via-[#0B3C5D] to-[#072F4A] rounded-b-3xl px-3 py-2 text-center shadow-lg relative overflow-hidden border-b border-white/10">
                  <div className="text-white text-[10px] font-black uppercase leading-tight tracking-[0.1em] relative z-10">
                    <div>NEWLY</div>
                    <div>LAUNCHED</div>
                  </div>
                </div>
              </div>

              <div className="relative h-32 mt-12 overflow-hidden bg-transparent">
                {newlyLaunchedProducts.map((product, idx) => (
                  <div
                    key={`${product.id || idx}-${product.imageUrl || product.name}`}
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${idx === currentProductIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name || 'Product'}
                        className="w-full h-full object-contain p-3 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                      />
                    ) : (
                      <div className="text-5xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                        {('emoji' in product && product.emoji) || '🐟'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-[#1CA7C7] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(28,167,199,0.5)]">
                  <span className="text-white text-[9px] font-black tracking-[0.1em] uppercase">For You</span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Drop */}
          <div className="flex-shrink-0 w-[140px]">
            <Link
              to="/category/all"
              className="block water-card water-shimmer-border rounded-[24px] overflow-hidden relative h-56 shadow-2xl transition-all hover:-translate-y-1 group"
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-[#BEEFFF] px-3 py-1 rounded-full shadow-lg border border-white/20">
                  <span className="text-[#072F4A] text-[10px] font-black tracking-widest uppercase">Special</span>
                </div>
              </div>
              <div className="flex items-center justify-center h-full px-2 relative z-10">
                <div className="text-center">
                  <div
                    className="text-[#6FD3FF] text-[24px] font-black leading-none mb-1 transform group-hover:scale-105 transition-transform"
                    style={{ textShadow: '0 0 10px rgba(111,211,255,0.5)' }}
                  >
                    PRICE
                  </div>
                  <div
                    className="text-white text-[28px] font-black leading-none transform group-hover:scale-105 transition-transform"
                    style={{ textShadow: '0 0 15px rgba(255,255,255,0.3)' }}
                  >
                    DROP
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Deep Sea Deals (Updated from Plum Cakes) */}
          <div className="flex-shrink-0 w-[140px]">
            <Link
              to="/category/marin"
              className="block water-card water-shimmer-border rounded-[24px] overflow-hidden relative h-56 shadow-2xl transition-all hover:-translate-y-1 group"
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-[#1CA7C7] px-3 py-1 rounded-full shadow-lg border border-white/20">
                  <span className="text-white text-[10px] font-black tracking-widest uppercase">Marin</span>
                </div>
              </div>
              <div className="absolute top-12 left-0 right-0 z-20 text-center px-2">
                <h3 className="text-white text-[13px] font-black tracking-[0.1em] uppercase" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.5)' }}>
                  Deep Sea Deals
                </h3>
              </div>
              <div className="flex items-center justify-center h-full pt-14 relative z-10">
                <div className="text-5xl transform group-hover:scale-110 transition-transform filter drop-shadow-[0_10px_20px_rgba(28,167,199,0.4)]">
                  🐋
                </div>
              </div>
            </Link>
          </div>

          {/* Fresh Arrivals */}
          <div className="flex-shrink-0 w-[140px]">
            <Link
              to="/category/all"
              className="block water-card water-shimmer-border rounded-[24px] overflow-hidden relative h-56 shadow-2xl transition-all hover:-translate-y-1 group"
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-[#6FD3FF] px-3 py-1 rounded-full shadow-lg border border-white/20">
                  <span className="text-[#072F4A] text-[10px] font-black tracking-widest uppercase">Fresh</span>
                </div>
              </div>
              <div className="absolute top-12 left-0 right-0 z-20 text-center px-2">
                <h3 className="text-white text-[13px] font-black tracking-[0.1em] uppercase" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.5)' }}>
                  Fresh Arrivals
                </h3>
              </div>
              <div className="flex items-center justify-center h-full pt-14 relative z-10 gap-2">
                <div className="text-3xl transform group-hover:scale-110 group-hover:-rotate-12 transition-transform filter drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]">🦀</div>
                <div className="text-4xl transform group-hover:scale-110 transition-transform filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.4)]">🐟</div>
                <div className="text-3xl transform group-hover:scale-110 group-hover:rotate-12 transition-transform filter drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]">🦐</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
