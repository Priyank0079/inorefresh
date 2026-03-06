import mongoose from 'mongoose';

const HeaderCategorySchema = new mongoose.Schema({
    name: String,
    status: String,
    slug: String,
}, { strict: false });

const HeaderCategory = mongoose.model('HeaderCategory', HeaderCategorySchema);

async function checkHeaderCategories() {
    try {
        await mongoose.connect('mongodb+srv://inorefresh:bbsd2002@cluster0.ghabmep.mongodb.net/test');
        console.log('Connected to MongoDB (test)');

        const categories = await HeaderCategory.find({});
        console.log('Total Header Categories:', categories.length);
        categories.forEach(c => {
            console.log(`- ${(c as any).name} (Status: ${(c as any).status}, Slug: ${(c as any).slug}, ID: ${c._id})`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkHeaderCategories();
