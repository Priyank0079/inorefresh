import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import HeaderCategory from "../models/HeaderCategory";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dhakadsnazzy";

async function check() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const headerCategories = await HeaderCategory.find({});
    console.log(`Total Header Categories: ${headerCategories.length}`);
    headerCategories.forEach(c => {
        console.log(`- ID: ${c._id}, Name: "${c.name}", Slug: "${c.slug}", Status: "${c.status}"`);
    });

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
