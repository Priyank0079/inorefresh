import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const cleanCategories2 = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('MongoDB Connected...');

        const Category = require('../src/models/Category').default;

        // List ALL categories
        const allCategories = await Category.find({}).lean();
        console.log(`Total categories: ${allCategories.length}`);
        allCategories.forEach((cat: any, i: number) => {
            console.log(`  ${i + 1}. "${cat.name}"`);
        });

        // Keep ONLY real categories — not dummy seeded pattern ones
        // Dummy pattern: "Masala Category X", "Masala Category X Subcategory Y"
        const dummyPattern = /^(masala category|fish category|grocery category|fashion category|sports category)/i;

        const toDelete = allCategories.filter((cat: any) => dummyPattern.test(cat.name));
        console.log(`\nDeleting ${toDelete.length} dummy categories...`);
        toDelete.forEach((cat: any) => console.log(`  ✗ "${cat.name}"`));

        if (toDelete.length > 0) {
            const ids = toDelete.map((cat: any) => cat._id);
            const result = await Category.deleteMany({ _id: { $in: ids } });
            console.log(`\n✅ Deleted ${result.deletedCount} dummy categories.`);
        }

        const remaining = await Category.find({}).lean();
        console.log(`\nFinal remaining categories (${remaining.length}):`);
        remaining.forEach((cat: any) => console.log(`  • "${cat.name}"`));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanCategories2();
