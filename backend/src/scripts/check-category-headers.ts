import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: String,
    status: String,
    headerCategoryId: mongoose.Types.ObjectId,
}, { strict: false });

const Category = mongoose.model('Category', CategorySchema);

async function checkCategoryHeaders() {
    try {
        await mongoose.connect('mongodb+srv://inorefresh:bbsd2002@cluster0.ghabmep.mongodb.net/test');
        console.log('Connected to MongoDB (test)');

        const categories = await Category.find({ status: "Active" });
        console.log('Active Categories:');
        categories.forEach(c => {
            console.log(`- ${(c as any).name} (HeaderID: ${(c as any).headerCategoryId})`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkCategoryHeaders();
