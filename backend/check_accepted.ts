import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './src/models/Order';

dotenv.config();

async function checkAccepted() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const orders = await Order.find({ status: 'Accepted' });
        console.log('Accepted Orders Count:', orders.length);
        orders.slice(0, 3).forEach((o, i) => {
            console.log(`Order ${i}: ID=${o._id}, deliveryBoy=${o.deliveryBoy}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAccepted();
