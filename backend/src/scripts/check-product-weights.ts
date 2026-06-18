/** Quick diagnostic: do products carry weight data? Run: npm run check:weights */
import mongoose from "mongoose";
import connectDB from "../config/db";
import Product from "../models/Product";

async function main() {
  await connectDB();
  const total = await Product.countDocuments();
  const withWeight = await Product.countDocuments({ weight: { $gt: 0 } });
  const sample = await Product.find({ weight: { $gt: 0 } }).select("name weight").limit(5).lean();
  console.log(`\nProducts total: ${total}`);
  console.log(`Products with weight > 0: ${withWeight} (${total ? Math.round((withWeight / total) * 100) : 0}%)`);
  console.log("Samples:");
  sample.forEach((p: any) => console.log(`   ${p.name} → weight=${p.weight}`));
  if (withWeight === 0) {
    console.log("\n⚠️  No products have a weight set → route weight will be 0 until product weights are filled in.");
  } else {
    console.log("\n✅ Weight data exists → routes will show real total weight.");
  }
  await mongoose.disconnect();
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
