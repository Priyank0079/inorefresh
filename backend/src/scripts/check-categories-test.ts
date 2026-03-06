import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: String,
    status: String,
    slug: String,
}, { strict: false });

const Category = mongoose.model('Category', CategorySchema);

async function checkCategories() {
    try {
        await mongoose.connect('mongodb+srv://inorefresh:bbsd2002@cluster0.ghabmep.mongodb.net/test');
        console.log('Connected to MongoDB (test)');

        const categories = await Category.find({});
        console.log('Total Categories:', categories.length);
        categories.forEach(c => {
            console.log(`- ${(c as any).name} (Status: ${(c as any).status}, Slug: ${(c as any).slug}, ID: ${c._id})`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkCategories();
