import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function check() {
    const uri = process.env.MONGODB_URI;
    if (!uri) process.exit(1);

    const client = await mongoose.connect(uri);
    const dbs = await client.connection.db?.admin().listDatabases();
    console.log("Databases:", dbs?.databases.map(d => d.name));

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
