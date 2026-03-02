import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

interface CategoryTile {
  id: string;
  name: string;
  productImages?: (string | undefined)[];
  image?: string; // Support single image property
  productCount?: number;
  categoryId?: string;
  subcategoryId?: string;
  productId?: string;
  sellerId?: string;
  bgColor?: string;
  slug?: string;
  type?: "subcategory" | "product" | "category";
}

interface CategoryTileSectionProps {
  title: string;
  tiles: CategoryTile[];
  columns?: 2 | 3 | 4 | 6 | 8; // Support all column options
  showProductCount?: boolean; // Show product count only for bestsellers
}

export default function CategoryTileSection({
  title,
  tiles,
  columns = 4,
  showProductCount = false,
}: CategoryTileSectionProps) {
  const navigate = useNavigate();

  const handleTileClick = (tile: CategoryTile) => {
    if (tile.subcategoryId || tile.type === "subcategory") {
      // Navigate to subcategory page or category with subcategory filter
      if (tile.categoryId) {
        navigate(
          `/category/${tile.categoryId}?subcategory=${tile.subcategoryId || tile.id
          }`
        );
      } else if (tile.slug) {
        navigate(`/category/${tile.slug}`);
      } else {
        navigate(`/category/subcategory/${tile.subcategoryId || tile.id}`);
      }
      return;
    }
    if (tile.categoryId) {
      navigate(`/category/${tile.categoryId}`);
      return;
    }
    if (tile.productId) {
      navigate(`/product/${tile.productId}`);
      return;
    }
    if ((tile as any).sellerId) {
      // Navigate to seller's products page or category
      navigate(`/seller/${(tile as any).sellerId}`);
      return;
    }
    // Otherwise just log for now
    console.log("Clicked tile", tile.id);
  };

  // Dynamic grid classes based on column count
  const getGridCols = () => {
    switch (columns) {
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-4";
      case 6:
        return "grid-cols-6";
      case 8:
        return "grid-cols-8";
      default:
        return "grid-cols-4";
    }
  };

  const gridCols = getGridCols();
  const gapClass = columns >= 6 ? "gap-1.5 md:gap-2.5" : "gap-2.5 md:gap-4";

  return (
    <div className="mb-6 md:mb-8 mt-0 overflow-visible">
      <h2 className="text-lg md:text-2xl font-semibold text-neutral-900 mb-3 md:mb-6 px-4 md:px-6 lg:px-8 tracking-tight">
        {title}
      </h2>
      <div className="px-4 md:px-6 lg:px-8 overflow-visible">
        <div className={`grid ${gridCols} ${gapClass} overflow-visible auto-rows-fr`}>
          {tiles.map((tile) => {
            const images =
              tile.productImages || (tile.image ? [tile.image] : []);
            const hasImages = images.filter(Boolean).length > 0;

            return (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col">
                <Link
                  to={
                    tile.subcategoryId || tile.type === "subcategory"
                      ? tile.categoryId
                        ? `/category/${tile.categoryId}?subcategory=${tile.subcategoryId || tile.id
                        }`
                        : tile.slug
                          ? `/category/${tile.slug}`
                          : `/category/subcategory/${tile.subcategoryId || tile.id
                          }`
                      : tile.productId
                        ? `/product/${tile.productId}`
                        : tile.type === "category"
                          ? tile.slug
                            ? `/category/${tile.slug}`
                            : tile.categoryId
                              ? `/category/${tile.categoryId}`
                              : "#"
                          : tile.categoryId
                            ? `/category/${tile.categoryId}`
                            : (tile as any).sellerId
                              ? `/seller/${(tile as any).sellerId}`
                              : "#"
                  }
                  onClick={(e) => {
                    if (
                      !tile.categoryId &&
                      !tile.productId &&
                      !tile.subcategoryId &&
                      !(tile as any).sellerId
                    ) {
                      e.preventDefault();
                      handleTileClick(tile);
                    }
                  }}
                  className={`block bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-neutral-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 h-full overflow-hidden relative group ${showProductCount ? "px-2.5 pt-2.5 pb-3" : "p-1.5"
                    }`}>
                  {/* 🌊 UNDERWATER CARD ENHANCEMENTS */}
                  {/* 1. Very faint top highlight reflection */}
                  <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none z-20" />

                  {/* 2. Subtle inner glow at 4% opacity */}
                  <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(0,224,198,0.04)] pointer-events-none z-10" />

                  {/* 3. Micro shimmer swipe animation on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none z-20" />
                  {/* Image - Single image for non-bestsellers, 2x2 grid for bestsellers */}
                  <div
                    className={`w-full rounded-xl overflow-hidden relative ${showProductCount ? "h-32 md:h-36 mb-2" : "aspect-square"
                      } ${tile.bgColor || "bg-neutral-50/50"}`}>

                    {/* Subtle Overlay Gradient for Depth */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-10" />

                    {hasImages ? (
                      showProductCount ? (
                        // Bestsellers: 2x2 grid
                        <div className="w-full h-full grid grid-cols-2 gap-1 p-1 bg-white">
                          {images.slice(0, 4).map((img, idx) =>
                            img ? (
                              <img
                                key={idx}
                                src={img}
                                alt=""
                                className="w-full h-full object-contain bg-neutral-50 rounded-lg border border-neutral-100/50"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div
                                key={idx}
                                className="w-full h-full bg-neutral-100 rounded-lg flex items-center justify-center text-[10px] text-neutral-400 font-bold">
                                {idx + 1}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        // Other sections: Single image
                        <div className="w-full h-full p-2 flex items-center justify-center bg-white transform group-hover:scale-105 transition-transform duration-500">
                          <img
                            src={images[0]}
                            alt={tile.name}
                            className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.05)]"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl font-bold text-neutral-200">${tile.name.charAt(0)}</div>`;
                              }
                            }}
                          />
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-neutral-200">
                        {tile.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Product count - shown first (only for bestsellers) */}
                  {showProductCount && tile.productCount && (
                    <div className="mb-2 flex justify-center">
                      <span className="inline-block bg-neutral-100 text-neutral-600 text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight tracking-tight">
                        +{tile.productCount} VARIETIES
                      </span>
                    </div>
                  )}

                  {/* Tile name - inside card only for bestsellers */}
                  {showProductCount && (
                    <div className="text-[12px] font-bold text-neutral-900 line-clamp-1 leading-tight text-center w-full block px-1">
                      {tile.name}
                    </div>
                  )}
                </Link>

                {/* Category name - outside card for non-bestsellers */}
                {!showProductCount && (
                  <div className="mt-2 text-center px-1">
                    <span className="text-[11px] md:text-[13px] font-bold text-neutral-800 line-clamp-1 leading-tight tracking-tight group-hover:text-[#009999] transition-colors">
                      {tile.name}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
