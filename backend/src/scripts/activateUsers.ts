import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function activateAllUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('Connected to MongoDB');

        // Update Horeca users
        const horecaResult = await mongoose.connection.collection('horeca_users').updateMany(
            { status: 'Pending' },
            { $set: { status: 'Active' } }
        );
        console.log(`Updated ${horecaResult.modifiedCount} HORECA users to Active`);

        // Update Retailer users
        const retailerResult = await mongoose.connection.collection('retailer_users').updateMany(
            { status: 'Pending' },
            { $set: { status: 'Active' } }
        );
        console.log(`Updated ${retailerResult.modifiedCount} Retailer users to Active`);

        // Update standard Customers just in case
        const customerResult = await mongoose.connection.collection('customers').updateMany(
            { status: 'Pending' },
            { $set: { status: 'Active' } }
        );
        console.log(`Updated ${customerResult.modifiedCount} Customers users to Active`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error updating users:', error);
        process.exit(1);
    }
}

activateAllUsers();
