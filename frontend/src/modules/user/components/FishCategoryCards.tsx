import CategoryTileSection from './CategoryTileSection';

export default function FishCategoryCards() {
    const categories = [
        {
            id: 'marine-fish',
            name: 'Marine Fish',
            image: '/images/marin_fish.png',
            slug: 'marine-fish',
            type: 'category'
        },
        {
            id: 'aqua-fish',
            name: 'Aqua Fish',
            image: '/images/aqua_fish.png',
            slug: 'aqua-fish',
            type: 'category'
        },
        {
            id: 'bangali-fish',
            name: 'Bangali Fish',
            image: '/images/bengali_fish.png',
            slug: 'bangali-fish',
            type: 'category'
        }
    ];

    return (
        <CategoryTileSection
            title="Explore Fish Categories"
            tiles={categories as any}
            columns={3}
        />
    );
}
