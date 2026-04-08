const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://inorefresh:bbsd2002@cluster0.ghabmep.mongodb.net/";

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    
    const collections = ['customers', 'retailer_users', 'horeca_users'];
    for (const collName of collections) {
      const count = await mongoose.connection.db.collection(collName).countDocuments();
      console.log(`Total in ${collName}: ${count}`);
      if (count > 0) {
        const latest = await mongoose.connection.db.collection(collName).find().sort({createdAt: -1}).limit(1).toArray();
        console.log(`Latest in ${collName}:`, latest[0]?.createdAt || latest[0]?.registrationDate);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
