require('dotenv').config();
const mongoose = require('mongoose');

async function checkStock() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const product = await Product.findOne({
        variations: {
            $elemMatch: {
                $or: [
                    { _id: new mongoose.Types.ObjectId("6a156a538df3202dbf58d804") },
                    { value: "6a156a538df3202dbf58d804" }
                ],
                stock: { $gte: 1 }
            }
        }
    }).lean();

    if (product) {
        console.log("Found Product with elemMatch and ObjectId!");
    } else {
        console.log("Product not found with elemMatch and ObjectId.");
    }
    
    // Let's also check if the variation exists at all
    const anyProduct = await Product.findOne({ "variations._id": new mongoose.Types.ObjectId("6a156a538df3202dbf58d804") }).lean();
    if (anyProduct) {
        console.log("Found it without elemMatch stock check!");
        const variation = anyProduct.variations.find(v => v._id && v._id.toString() === "6a156a538df3202dbf58d804");
        console.log("Variation:", variation);
    } else {
        console.log("Not found at all with this ObjectId!");
    }
    
    mongoose.disconnect();
}

checkStock().catch(console.error);
