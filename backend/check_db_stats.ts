import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './src/models/Order';
import Delivery from './src/models/Delivery';

dotenv.config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        const deliveryCount = await Delivery.countDocuments();
        console.log('Total Delivery Partners:', deliveryCount);

        const orderCount = await Order.countDocuments();
        console.log('Total Orders:', orderCount);

        const assignedOrders = await Order.countDocuments({ deliveryBoy: { $exists: true, $ne: null } });
        console.log('Assigned Orders:', assignedOrders);

        const statuses = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        console.log('Order Statuses:', JSON.stringify(statuses, null, 2));

        const deliveryPartner = await Delivery.findOne();
        if (deliveryPartner) {
            console.log('Sample Delivery Partner ID:', deliveryPartner._id);
            const myOrders = await Order.countDocuments({ deliveryBoy: deliveryPartner._id });
            console.log('Orders for sample partner:', myOrders);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
