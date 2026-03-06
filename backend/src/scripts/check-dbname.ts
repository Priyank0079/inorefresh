import mongoose from 'mongoose';

async function checkDbName() {
    try {
        const conn = await mongoose.connect('mongodb+srv://inorefresh:bbsd2002@cluster0.ghabmep.mongodb.net/');
        console.log('Connected to MongoDB cluster');
        console.log('Database Name:', conn.connection.name);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkDbName();
