require('dotenv').config();
const mongoose = require('mongoose');

async function checkStock() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const product = await Product.findOne({ "variations._id": new mongoose.Types.ObjectId("6a0aa5df7d98abd920feebea") }).lean();

    if (product) {
        console.log("Found Product:", product.productName);
        const variation = product.variations.find(v => v._id.toString() === "6a0aa5df7d98abd920feebea");
        console.log("Variation found:", variation);
    } else {
        console.log("Product not found with this variation ID");
    }

    mongoose.disconnect();
}

checkStock().catch(console.error);
