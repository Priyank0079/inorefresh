import CategoryTileSection from './CategoryTileSection';

export default function FishCategoryCards() {
    const categories = [
        {
            id: 'marine-fish',
            name: 'Marine Fish',
            image: '/images/fish/marine-fish.jpg',
            slug: 'marine-fish',
            type: 'category'
        },
        {
            id: 'aqua-fish',
            name: 'Aqua Fish',
            image: '/images/fish/freshwater-fish.jpg',
            slug: 'aqua-fish',
            type: 'category'
        },
        {
            id: 'bangali-fish',
            name: 'Bangali Fish',
            image: '/images/fish/traditional-fish.jpg',
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
