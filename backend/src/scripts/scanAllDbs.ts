import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function check() {
    const uri = process.env.MONGODB_URI;
    if (!uri) process.exit(1);

    const client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB via URI: ", uri);

    const admin = client.db().admin();
    const dbs = await admin.listDatabases();

    for (const dbInfo of dbs.databases) {
        if (["admin", "local", "config"].includes(dbInfo.name)) continue;

        console.log(`\n--- Database: ${dbInfo.name} ---`);
        const db = client.db(dbInfo.name);
        const collections = await db.listCollections().toArray();
        const headerCatCol = collections.find(c => c.name === "headercategories");

        if (headerCatCol) {
            const count = await db.collection("headercategories").countDocuments();
            console.log(`HeaderCategories count: ${count}`);
            const docs = await db.collection("headercategories").find({}).toArray();
            docs.forEach(d => {
                console.log(`- ${d.name} (${d.slug}) [${d.status}]`);
            });
        }
    }

    await client.close();
    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
