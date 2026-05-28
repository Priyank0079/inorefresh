require('dotenv').config();
const mongoose = require('mongoose');

async function checkStock() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const products = await Product.find({ productName: { $regex: /Karimeen/i } }).lean();
    
    console.log(`Found ${products.length} Karimeen products`);
    products.forEach(p => {
        console.log(`Product: ${p.productName}, ID: ${p._id}, Stock: ${p.stock}`);
        if (p.variations) {
            p.variations.forEach(v => {
                console.log(`  Variation _id: ${v._id}, value: ${v.value}, stock: ${v.stock}`);
            });
        }
    });
    
    mongoose.disconnect();
}

checkStock().catch(console.error);
