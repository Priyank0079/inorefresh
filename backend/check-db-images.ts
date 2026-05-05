
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dhakadsnazzy';

async function checkImages() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');
    
    const products = await Product.find({ productName: /Big Aar Mach/i }).lean();
    console.log(`Found ${products.length} products matching Big Aar Mach:`);
    products.forEach(p => {
        console.log(`- Name: ${p.productName}`);
        console.log(`  Main Image: ${p.mainImage}`);
    });

    const anyProduct = await Product.findOne({ mainImage: { $exists: true, $ne: '' } }).lean();
    if (anyProduct) {
        console.log('\nSample product image:');
        console.log(`- Name: ${anyProduct.productName}`);
        console.log(`  Main Image: ${anyProduct.mainImage}`);
    } else {
        console.log('\nNo products with images found.');
    }
    
    await mongoose.disconnect();
    process.exit(0);
}

checkImages().catch(err => {
    console.error(err);
    process.exit(1);
});
