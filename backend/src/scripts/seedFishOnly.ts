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

const fishHeaders = [
    {
        name: "Aqua Fish",
        slug: "aqua-fish",
        iconName: "aqua-fish",
        theme: "teal",
        categories: [
            { name: "Freshwater Fish", items: ["Katla", "Rohu", "Tilapia"] }
        ]
    },
    {
        name: "Marine Fish",
        slug: "marine-fish",
        iconName: "marin-fish",
        theme: "sports",
        categories: [
            { name: "Ocean Catch", items: ["Lobster", "Pomfret", "Mackerel"] }
        ]
    },
    {
        name: "Bengali Fish",
        slug: "bengali-fish",
        iconName: "bengali-fish",
        theme: "orange",
        categories: [
            { name: "Traditional Favorites", items: ["Hilsa", "Aar Mach", "Boal"] }
        ]
    }
];

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const warehouses = await Warehouse.find({ status: "ACTIVE" });
    if (warehouses.length === 0) {
        console.error("No active warehouses found. Seeding aborted.");
        process.exit(1);
    }

    // Clear everything
    await Product.deleteMany({});
    await Category.deleteMany({});
    await HeaderCategory.deleteMany({});
    await LowestPricesProduct.deleteMany({});
    await BestsellerCard.deleteMany({});
    await PromoStrip.deleteMany({});
    console.log("Cleared all existing category and product data");

    for (let i = 0; i < fishHeaders.length; i++) {
        const hData = fishHeaders[i];

        // Create Header Category
        const headerCat = await HeaderCategory.create({
            name: hData.name,
            slug: hData.slug, // Use as theme mapping
            iconLibrary: "Custom",
            iconName: hData.iconName,
            order: i + 1,
            status: "Published",
            relatedCategory: hData.slug
        });
        console.log(`Created Header Category: ${hData.name}`);

        for (const cData of hData.categories) {
            // Create Category under this Header
            const cat = await Category.create({
                name: cData.name,
                slug: cData.name.toLowerCase().replace(/\s+/g, '-'),
                headerCategoryId: headerCat._id,
                status: "Active",
                order: 1,
                image: `/images/fish/${hData.slug}.jpg`
            });

            for (const itemName of cData.items) {
                // Create Products for each warehouse
                for (const warehouse of warehouses) {
                    await Product.create({
                        productName: itemName,
                        category: cat._id,
                        headerCategoryId: headerCat._id,
                        pack: "1kg",
                        price: 500,
                        compareAtPrice: 600,
                        stock: 100,
                        warehouse: warehouse._id,
                        mainImage: `/images/fish/${itemName.toLowerCase().replace(/\s+/g, '-')}.jpg`,
                        publish: true,
                        status: "Active",
                        smallDescription: `Premium ${itemName} from our fresh catch.`,
                        description: `Enjoy the freshest ${itemName} delivered to your doorstep.`
                    });
                }
            }
        }
    }

    console.log("Seeding complete! Only 3 fish header categories remain.");
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
