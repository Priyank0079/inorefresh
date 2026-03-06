import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const cleanCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('MongoDB Connected...');

        const Category = require('../src/models/Category').default;

        // List ALL categories first
        const allCategories = await Category.find({}).lean();
        console.log(`\nTotal categories found: ${allCategories.length}`);
        console.log('\nAll categories:');
        allCategories.forEach((cat: any, i: number) => {
            console.log(`  ${i + 1}. ${cat.name} | status: ${cat.status} | headerCategoryId: ${cat.headerCategoryId || 'none'}`);
        });

        // Find the fish categories to KEEP (case-insensitive)
        const keepCategories = allCategories.filter((cat: any) =>
            cat.name.toLowerCase().includes('fish') ||
            cat.name.toLowerCase().includes('aqua') ||
            cat.name.toLowerCase().includes('seafood') ||
            cat.name.toLowerCase().includes('masala') // keeping masala too if present
        );

        console.log(`\nCategories to KEEP (${keepCategories.length}):`);
        keepCategories.forEach((cat: any) => console.log(`  ✓ ${cat.name}`));

        const keepIds = keepCategories.map((cat: any) => cat._id.toString());

        // Delete all categories NOT in the keep list
        const toDelete = allCategories.filter((cat: any) => !keepIds.includes(cat._id.toString()));
        console.log(`\nCategories to DELETE (${toDelete.length}):`);
        toDelete.forEach((cat: any) => console.log(`  ✗ ${cat.name}`));

        if (toDelete.length === 0) {
            console.log('\nNo categories to delete.');
        } else {
            const deleteIds = toDelete.map((cat: any) => cat._id);
            const result = await Category.deleteMany({ _id: { $in: deleteIds } });
            console.log(`\n✅ Deleted ${result.deletedCount} categories.`);
        }

        // Show final state
        const remaining = await Category.find({}).lean();
        console.log(`\nRemaining categories (${remaining.length}):`);
        remaining.forEach((cat: any) => console.log(`  • ${cat.name}`));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanCategories();
