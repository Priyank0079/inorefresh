import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Delivery from './src/models/Delivery';

dotenv.config();

async function checkPartner() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const partner = await Delivery.findOne();
        console.log('Partner Data:', JSON.stringify(partner, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPartner();
