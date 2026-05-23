import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inorfresh');
  try {
    const cats = await Category.find({ status: 'Active' }).select('name slug status headerCategoryId parentId').lean();
    console.log(JSON.stringify(cats, null, 2));
  } catch(e) {
    console.error('Error:', e);
  }
  process.exit(0);
}
run();
