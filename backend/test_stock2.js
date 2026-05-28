require('dotenv').config();
const mongoose = require('mongoose');

async function checkStock() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const product = await Product.findOne({ "variations._id": "6a0aa5df7d98abd920feebea" }).lean();

    if (product) {
        console.log("Found Product with string ID");
    } else {
        console.log("Product not found with string ID");
    }

    mongoose.disconnect();
}

checkStock().catch(console.error);
