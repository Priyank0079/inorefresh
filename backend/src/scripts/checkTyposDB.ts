import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dhakadsnazzy";

async function check() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const HeaderCategory = mongoose.connection.db?.collection("headercategories");
    const typos = ["auqa-fish", "marin-fish", "bengoli-fish"];

    const docs = await HeaderCategory?.find({ $or: [{ slug: { $in: typos } }, { name: { $in: ["Auqa fish", "marin fish", "Bengoli fish"] } }] }).toArray();
    console.log(`Found ${docs?.length || 0} documents with typos`);
    docs?.forEach(d => {
        console.log(`- ID: ${d._id}, Name: "${d.name}", Slug: "${d.slug}"`);
    });

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
