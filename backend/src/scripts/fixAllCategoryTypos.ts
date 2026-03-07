import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function fixAll() {
    const uri = process.env.MONGODB_URI;
    if (!uri) process.exit(1);

    const client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB via URI: ", uri);

    const admin = client.db().admin();
    const dbs = await admin.listDatabases();

    const fixes = [
        { oldSlug: /^auqa-fish$/i, newSlug: "aqua-fish", oldName: /^Auqa fish$/i, newName: "Aqua Fish" },
        { oldSlug: /^marin-fish$/i, newSlug: "marine-fish", oldName: /^marin fish$/i, newName: "Marine Fish" },
        { oldSlug: /^bengoli-fish$/i, newSlug: "bangali-fish", oldName: /^Bengoli fish$/i, newName: "Traditional fish" }
    ];

    for (const dbInfo of dbs.databases) {
        if (["admin", "local", "config"].includes(dbInfo.name)) continue;

        console.log(`\n--- Fixing Database: ${dbInfo.name} ---`);
        const db = client.db(dbInfo.name);

        for (const f of fixes) {
            // Fix HeaderCategories
            const hRes = await db.collection("headercategories").updateMany(
                { $or: [{ slug: f.oldSlug }, { name: f.oldName }] },
                { $set: { slug: f.newSlug, name: f.newName } }
            );
            if (hRes.modifiedCount > 0) console.log(`Fixed ${hRes.modifiedCount} HeaderCategories`);

            // Fix Categories
            const cRes = await db.collection("categories").updateMany(
                { $or: [{ slug: f.oldSlug }, { name: f.oldName }] },
                { $set: { slug: f.newSlug, name: f.newName } }
            );
            if (cRes.modifiedCount > 0) console.log(`Fixed ${cRes.modifiedCount} Categories`);

            // Fix Products reference? If they use slug strings... unlikely, usually ObjectID or category field
        }
    }

    await client.close();
    process.exit(0);
}

fixAll().catch(err => {
    console.error(err);
    process.exit(1);
});
