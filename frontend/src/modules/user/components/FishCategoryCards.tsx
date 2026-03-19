import ExploreCard from './ExploreCard';

export default function FishCategoryCards() {
    const categories = [
        {
            id: 'marine-fish',
            name: 'Marine Fish',
            image: '/images/fish/marine-fish.jpg',
            link: '/?tab=marine-fish'
        },
        {
            id: 'aqua-fish',
            name: 'Aqua Fish',
            image: '/images/aqua_fish.png',
            link: '/?tab=aqua-fish'
        },
        {
            id: 'bangali-fish',
            name: 'Bengali Fish',
            image: '/images/bengali_fish.png',
            link: '/?tab=bangali-fish'
        }
    ];

    return (
        <div className="px-4 md:px-8 max-w-[1280px] mx-auto py-8">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-xl md:text-2xl font-black text-[#072F4A] whitespace-nowrap uppercase tracking-widest">
                    Explore <span className="text-[#1CA7C7]">Fish</span> Categories
                </h2>
                <div className="h-[2px] w-full bg-gradient-to-r from-[#072F4A]/10 to-transparent" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {categories.map((cat, idx) => (
                    <ExploreCard
                        key={cat.id}
                        id={cat.id}
                        name={cat.name}
                        image={cat.image}
                        link={cat.link}
                        index={idx}
                    />
                ))}
            </div>
        </div>
    );
}

