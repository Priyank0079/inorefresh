import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function check() {
    const uri = process.env.MONGODB_URI;
    console.log(`URI: ${uri}`);
    if (!uri) process.exit(1);

    const conn = await mongoose.connect(uri);
    console.log(`Connected to host: ${conn.connection.host}`);
    console.log(`Connected to database: ${conn.connection.name}`);

    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log("Collections:", collections?.map(c => c.name));

    const HeaderCategory = mongoose.connection.db?.collection("headercategories");
    const docs = await HeaderCategory?.find({}).toArray();
    console.log(`HeaderCategories count: ${docs?.length}`);
    docs?.forEach(d => {
        console.log(`- ${d.name} (${d.slug}) [${d.status}]`);
    });

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
