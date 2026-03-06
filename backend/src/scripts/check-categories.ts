import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const CategorySchema = new mongoose.Schema({
    name: String,
    status: String,
    slug: String,
}, { strict: false });

const Category = mongoose.model('Category', CategorySchema);

async function checkCategories() {
    try {
        await mongoose.connect('mongodb+srv://inorefresh:bbsd2002@cluster0.ghabmep.mongodb.net/dhakadsnazzy2');
        console.log('Connected to MongoDB');

        const categories = await Category.find({});
        console.log('Total Categories:', categories.length);
        categories.forEach(c => {
            console.log(`- ${c.name} (Status: ${c.status}, Slug: ${c.slug}, ID: ${c._id})`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkCategories();
