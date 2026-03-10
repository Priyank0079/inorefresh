import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product";
import Inventory from "../models/Inventory";
import CartItem from "../models/CartItem";
import Wishlist from "../models/Wishlist";
import HomeSection from "../models/HomeSection";
import BestsellerCard from "../models/BestsellerCard";
import LowestPricesProduct from "../models/LowestPricesProduct";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/zeto-mart";

async function removeAllProducts() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // Count before
        const productCountBefore = await Product.countDocuments();
        const inventoryCountBefore = await Inventory.countDocuments();
        const cartItemCountBefore = await CartItem.countDocuments();

        console.log(`Initial stats: ${productCountBefore} products, ${inventoryCountBefore} inventory records, ${cartItemCountBefore} cart items.`);

        if (productCountBefore === 0) {
            console.log("No products found to delete.");
            process.exit(0);
        }

        console.log("Initiating cleanup...");

        // 1. Delete all products
        const productResult = await Product.deleteMany({});
        console.log(`- Deleted ${productResult.deletedCount} products.`);

        // 2. Delete all related inventory records
        const inventoryResult = await Inventory.deleteMany({});
        console.log(`- Deleted ${inventoryResult.deletedCount} inventory records.`);

        // 3. Clear cart items
        const cartItemResult = await CartItem.deleteMany({});
        console.log(`- Deleted ${cartItemResult.deletedCount} cart items.`);

        // 4. Clear product references in Wishlists
        const wishlistResult = await Wishlist.updateMany({}, { $set: { products: [] } });
        console.log(`- Cleared products from ${wishlistResult.modifiedCount} wishlists.`);

        // 5. Clear product references in HomeSections
        const homeSectionResult = await HomeSection.updateMany({}, { $set: { products: [] } });
        console.log(`- Cleared product references in ${homeSectionResult.modifiedCount} home sections.`);

        // 6. Delete BestsellerCards (which are usually product-specific)
        const bestsellerResult = await BestsellerCard.deleteMany({});
        console.log(`- Deleted ${bestsellerResult.deletedCount} bestseller cards.`);

        // 7. Delete LowestPricesProducts
        const lowestPricesResult = await LowestPricesProduct.deleteMany({});
        console.log(`- Deleted ${lowestPricesResult.deletedCount} lowest price product recommendations.`);

        console.log("\nCleanup completed successfully. Only products (not categories) have been removed.");
        console.log("All products from warehouses are now gone and won't show in Admin or User modules.");

        process.exit(0);
    } catch (err) {
        console.error("Error during cleanup:", err);
        process.exit(1);
    }
}

removeAllProducts();
