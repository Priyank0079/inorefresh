import { useState, useEffect } from 'react';
import ExploreCard from './ExploreCard';
import { getCategories } from '../../../services/api/categoryService';

export default function FishCategoryCards() {
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const res = await getCategories();
                if (res.success && res.data) {
                    setCategories(res.data);
                }
            } catch (err) {
                console.error("Error fetching categories for Explore:", err);
            }
        };
        fetchCats();
    }, []);

    return (
        <div className="px-4 md:px-8 max-w-[1280px] mx-auto pt-2 pb-0">
            <div className="flex items-center gap-3 mb-5">
                <h2 className="text-lg md:text-xl font-black text-[#072F4A] whitespace-nowrap uppercase tracking-[0.15em]">
                    Explore <span className="text-[#1CA7C7]">Fish</span>
                </h2>
                <div className="h-[1.5px] w-full bg-gradient-to-r from-[#072F4A]/10 to-transparent" />
            </div>

            <div className="flex overflow-x-auto gap-3 md:gap-5 pb-6 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide no-scrollbar snap-x snap-mandatory">
                {categories.map((cat, idx) => (
                    <div key={cat._id} className="flex-shrink-0 w-[140px] md:w-[180px] snap-start">
                        <ExploreCard
                            id={cat._id}
                            name={cat.name}
                            image={cat.image || '/images/aqua_fish_banner.webp'}
                            link={`/?tab=${cat.slug || cat._id}`}
                            index={idx}
                            compact={true}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

