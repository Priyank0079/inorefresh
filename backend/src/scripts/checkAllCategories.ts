import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Category from "../models/Category";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dhakadsnazzy";

async function check() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const categories = await Category.find();
    console.log(`Total categories: ${categories.length}`);
    categories.forEach(c => {
        console.log(`- ID: ${c._id}, Name: "${c.name}", Slug: "${c.slug}"`);
    });

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
