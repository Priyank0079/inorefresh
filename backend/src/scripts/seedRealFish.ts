import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Category from "../models/Category";
import HeaderCategory from "../models/HeaderCategory";
import Product from "../models/Product";
import Warehouse from "../models/Warehouse";
import LowestPricesProduct from "../models/LowestPricesProduct";
import BestsellerCard from "../models/BestsellerCard";
import PromoStrip from "../models/PromoStrip";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dhakadsnazzy";

const fishData = [
    {
        category: "Marine Fish",
        items: [
            { name: "Lobster", size: "1-2 kg", price: 800 },
            { name: "Sea Tiger Prawns", size: "200-300 g", price: 600 },
            { name: "Seer Fish", size: "1-2 kg", price: 750 },
            { name: "Mackerel", size: "500g", price: 300 },
            { name: "Barracuda", size: "1-2 kg", price: 400 },
            { name: "Squid", size: "200-500 g", price: 350 },
            { name: "Pomfret", size: "1-2 kg", price: 850 },
            { name: "Indian Salmon", size: "1-2 kg", price: 700 },
            { name: "Sardine", size: "500g", price: 200 },
            { name: "Silver Fish", size: "500g", price: 250 },
            { name: "Spot Crab", size: "1-2 kg", price: 450 },
            { name: "Red Snapper", size: "1-2 kg", price: 600 },
            { name: "Blue Crab", size: "1-2 kg", price: 400 },
            { name: "White Snapper", size: "1-2 kg", price: 550 },
            { name: "Atlantic Salmon", size: "1-2 kg", price: 1200 },
        ]
    },
    {
        category: "Aqua Fish",
        items: [
            { name: "Katla Big", size: "2-3 kg", price: 350 },
            { name: "Katla Medium", size: "1-2 kg", price: 300 },
            { name: "Rohu Big", size: "2-3 kg", price: 320 },
            { name: "Rohu Medium", size: "1-2 kg", price: 280 },
            { name: "Tilapia", size: "500g-1kg", price: 250 },
            { name: "Pangus", size: "1-2 kg", price: 200 },
            { name: "Ropchand", size: "500g-1kg", price: 400 },
            { name: "Papada", size: "500g", price: 450 },
            { name: "Glass Carp", size: "1-2 kg", price: 280 },
            { name: "Mirgal", size: "1-2 kg", price: 260 },
            { name: "Silver", size: "1-2 kg", price: 240 }
        ]
    },
    {
        category: "Bangali Fish",
        items: [
            { name: "Maral", size: "1-2 kg", price: 400 },
            { name: "Katla", size: "1-2 kg", price: 300 },
            { name: "Roghu", size: "1-2 kg", price: 280 },
            { name: "Big Aar Mach", size: "2-3 kg", price: 650 },
            { name: "Medium Aar Mach", size: "1-2 kg", price: 550 },
            { name: "Valai Boal", size: "1-2 kg", price: 500 },
            { name: "Soul Putty", size: "500g", price: 350 },
            { name: "Small White Putty", size: "250g", price: 300 },
            { name: "Bata", size: "500g", price: 280 },
            { name: "Beale", size: "500g", price: 320 },
            { name: "PoliMachi", size: "500g", price: 300 },
            { name: "Koi Machi", size: "250g", price: 500 },
            { name: "Singhi Mach", size: "250g", price: 550 },
            { name: "Hilsa", size: "1-2 kg", price: 1500 }
        ]
    }
];

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Get all warehouses to ensure every account can see products
    const warehouses = await Warehouse.find({ status: "ACTIVE" });
    if (warehouses.length === 0) {
        console.error("No active warehouses found");
        process.exit(1);
    }

    console.log(`Seeding for ${warehouses.length} active warehouses: ${warehouses.map(w => w.warehouseName).join(", ")}`);

    // Clear everything related to products/categories/sections
    await Product.deleteMany({});
    await Category.deleteMany({});
    await HeaderCategory.deleteMany({});
    await LowestPricesProduct.deleteMany({});
    await BestsellerCard.deleteMany({});
    await PromoStrip.deleteMany({});
    console.log("Cleared existing data models");

    // Create a Fish Marketplace HeaderCategory
    const headerCat = await HeaderCategory.create({
        name: "Fish Market",
        slug: "fish-market",
        iconLibrary: "MaterialCommunityIcons",
        iconName: "fish",
        order: 1,
        status: "Published"
    });

    const lowestPriceItems: mongoose.Types.ObjectId[] = [];
    const createdCategories: any[] = [];

    for (const group of fishData) {
        let catImage = "/images/fish/marine-fish.jpg";
        if (group.category === "Aqua Fish") catImage = "/images/fish/freshwater-fish.jpg";
        if (group.category === "Bangali Fish") catImage = "/images/fish/traditional-fish.jpg";

        const cat = await Category.create({
            name: group.category,
            slug: group.category.toLowerCase().replace(/\s+/g, '-'),
            headerCategoryId: headerCat._id,
            image: catImage,
            status: "Active",
            order: 1
        });
        createdCategories.push(cat);

        for (const item of group.items) {
            // Random rating (4.2 - 4.9)
            const rating = 4 + (Math.floor(Math.random() * 8) + 2) / 10;
            const reviews = 10 + Math.floor(Math.random() * 200);

            // Create this product for EVERY warehouse so the list is not empty for any user
            for (const warehouse of warehouses) {
                const stock = 30 + Math.floor(Math.random() * 170); // 30-200 units
                const p = await Product.create({
                    productName: item.name,
                    category: cat._id,
                    headerCategoryId: headerCat._id,
                    pack: item.size,
                    price: item.price,
                    compareAtPrice: item.price + 50,
                    stock: stock,
                    warehouse: warehouse._id,
                    mainImage: `/images/fish/${item.name.toLowerCase().replace(/\s+/g, '-') + '.jpg'}`,
                    publish: true,
                    status: "Active",
                    smallDescription: `Fresh ${item.name} (${item.size}) directly from the source. High quality, premium packing.`,
                    description: `Indulge in the finest ${item.name}. Sourced with care, each ${item.size} pack ensures you get the freshest quality for your meals. Perfect for grilling, frying, or traditional curries.`,
                    isShopByStoreOnly: false,
                    rating,
                    reviewsCount: reviews,
                    discount: Math.round((50 / (item.price + 50)) * 100),
                    variations: [
                        {
                            name: "Standard",
                            value: item.size,
                            price: item.price,
                            discPrice: item.price,
                            stock: stock,
                            status: "Available",
                        },
                    ]
                });

                // Pick a few items for Lowest Prices section (only from one warehouse to avoid duplicates in that section)
                if (warehouse._id.toString() === warehouses[0]._id.toString()) {
                    if (["Lobster", "Seer Fish", "Katla Big", "Hilsa"].includes(item.name)) {
                        lowestPriceItems.push(p._id as mongoose.Types.ObjectId);
                    }
                }
            }
        }
    }

    // Seed Lowest Prices Product
    console.log("Seeding Lowest Prices section...");
    for (let i = 0; i < lowestPriceItems.length; i++) {
        await LowestPricesProduct.create({
            product: lowestPriceItems[i],
            order: i,
            isActive: true
        });
    }

    // Seed Bestseller Cards
    console.log("Seeding Bestseller cards...");
    for (let i = 0; i < createdCategories.length; i++) {
        await BestsellerCard.create({
            name: `Best of ${createdCategories[i].name}`,
            category: createdCategories[i]._id,
            order: i,
            isActive: true
        });
    }

    // Seed PromoStrip for Fish Market
    console.log("Seeding PromoStrip...");
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days sale

    await PromoStrip.create({
        headerCategorySlug: "fish-market",
        heading: "SEA HARVEST SALE",
        saleText: "FISH SALE",
        startDate,
        endDate,
        isActive: true,
        order: 1,
        categoryCards: createdCategories.map((cat, i) => ({
            categoryId: cat._id,
            title: cat.name,
            badge: `${20 + i * 5}% OFF`,
            discountPercentage: 20 + i * 5,
            order: i
        })),
        featuredProducts: lowestPriceItems,
        crazyDealsTitle: "FRESH CATCH DEALS"
    });

    console.log("Seeding complete for all warehouses!");
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
