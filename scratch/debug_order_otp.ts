import mongoose from 'mongoose';
import Order from './backend/src/models/Order';
import Customer from './backend/src/models/Customer';
import HorecaUser from './backend/src/models/HorecaUser';
import RetailerUser from './backend/src/models/RetailerUser';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function debugOrder() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inorfresh');
        console.log('Connected to DB');

        const orderId = '6a0710a16983d90107a04a6b';
        const order = await Order.findById(orderId);

        if (!order) {
            console.log('Order not found');
            return;
        }

        console.log('ORDER DETAILS:');
        console.log('- ID:', order._id);
        console.log('- Status:', order.status);
        console.log('- deliveryOtp (on Order):', order.deliveryOtp);
        console.log('- customer ID:', order.customer);

        const userId = order.customer.toString();
        const customer = await Customer.findById(userId);
        const horeca = await HorecaUser.findById(userId);
        const retailer = await RetailerUser.findById(userId);

        if (customer) {
            console.log('CUSTOMER FOUND:');
            console.log('- deliveryOtp:', customer.deliveryOtp);
        }
        if (horeca) {
            console.log('HORECA FOUND:');
            console.log('- deliveryOtp:', horeca.deliveryOtp);
        }
        if (retailer) {
            console.log('RETAILER FOUND:');
            console.log('- deliveryOtp:', retailer.deliveryOtp);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

debugOrder();
