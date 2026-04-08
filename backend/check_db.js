const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://inorefresh:bbsd2002@cluster0.ghabmep.mongodb.net/";

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    
    // We need to know the database name. The URI ends with /
    // Usually it defaults to 'test' if not specified, but let's check
    console.log("Database:", mongoose.connection.name);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    // Try to find the 'customers' collection
    if (collections.some(c => c.name === 'customers')) {
        const count = await mongoose.connection.db.collection('customers').countDocuments();
        console.log("Total customers in 'customers' collection:", count);
        
        const latest = await mongoose.connection.db.collection('customers').find().sort({createdAt: -1}).limit(1).toArray();
        console.log("Latest customer:", JSON.stringify(latest, null, 2));
    } else {
        console.log("No 'customers' collection found.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
