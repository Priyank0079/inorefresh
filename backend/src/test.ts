import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inorfresh');
  try {
    const cat = await Category.create({
      name: 'test-category-' + Date.now(),
      image: '',
      order: 0,
      isBestseller: false,
      hasWarning: false,
      groupCategory: '',
      parentId: null,
      headerCategoryId: null,
      commissionRate: 0,
      status: 'Active'
    });
    console.log('Success:', cat);
  } catch(e) {
    console.error('Mongoose Error:', e);
  }
  process.exit(0);
}
run();
