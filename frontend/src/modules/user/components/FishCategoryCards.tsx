import ExploreCard from './ExploreCard';

export default function FishCategoryCards() {
    const categories = [
        {
            id: 'marine-fish',
            name: 'Marine Fish',
            image: '/images/marine_fish_banner.png',
            link: '/?tab=marine-fish'
        },
        {
            id: 'aqua-fish',
            name: 'Aqua Fish',
            image: '/images/aqua_fish_banner.png',
            link: '/?tab=aqua-fish'
        },
        {
            id: 'bangali-fish',
            name: 'Bengali Fish',
            image: '/images/bengali_fish_banner.png',
            link: '/?tab=bangali-fish'
        }
    ];

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
                    <div key={cat.id} className="flex-shrink-0 w-[140px] md:w-[180px] snap-start">
                        <ExploreCard
                            id={cat.id}
                            name={cat.name}
                            image={cat.image}
                            link={cat.link}
                            index={idx}
                            compact={true}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

