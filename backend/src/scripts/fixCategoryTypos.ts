import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI;

async function fix() {
    if (!MONGO_URI) process.exit(1);

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB via URI: ", MONGO_URI);

    const db = mongoose.connection.db;
    if (!db) {
        console.error("DB connection not established");
        process.exit(1);
    }

    const HeaderCategory = db.collection("headercategories");
    const Category = db.collection("categories");

    // List of typos and their fixes
    const fixes = [
        { oldSlug: "auqa-fish", newSlug: "aqua-fish", oldName: "Auqa fish", newName: "Aqua Fish" },
        { oldSlug: "marin-fish", newSlug: "marine-fish", oldName: "marin fish", newName: "Marine Fish" },
        { oldSlug: "bengoli-fish", newSlug: "bangali-fish", oldName: "Bengoli fish", newName: "Bangali Fish" }
    ];

    for (const f of fixes) {
        // Fix Header Categories
        const hRes = await HeaderCategory.updateMany(
            { $or: [{ slug: f.oldSlug }, { name: f.oldName }] },
            { $set: { slug: f.newSlug, name: f.newName } }
        );
        if (hRes.modifiedCount > 0) {
            console.log(`Fixed ${hRes.modifiedCount} HeaderCategories for ${f.newName}`);
        }

        // Fix Primary Categories
        const cRes = await Category.updateMany(
            { $or: [{ slug: f.oldSlug }, { name: f.oldName }] },
            { $set: { slug: f.newSlug, name: f.newName } }
        );
        if (cRes.modifiedCount > 0) {
            console.log(`Fixed ${cRes.modifiedCount} Categories for ${f.newName}`);
        }
    }

    console.log("Database cleanup complete.");
    process.exit(0);
}

fix().catch(err => {
    console.error(err);
    process.exit(1);
});
