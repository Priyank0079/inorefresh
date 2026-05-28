require('dotenv').config();
const mongoose = require('mongoose');

async function checkStock() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const anyProduct = await Product.findOne({ "variations._id": new mongoose.Types.ObjectId("6a156a538df3202dbf58d804") }).lean();
    if (anyProduct) {
        console.log("Total Product Stock:", anyProduct.stock);
        console.log("Variations:");
        anyProduct.variations.forEach(v => {
            console.log(`  _id: ${v._id}, stock: ${v.stock}, value: ${v.value}`);
        });
    }
    
    mongoose.disconnect();
}

checkStock().catch(console.error);
