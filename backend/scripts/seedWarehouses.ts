import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const createDummyWarehouses = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('MongoDB Connected...');

        // Import the model using CommonJS require because it avoids ts-node issues with schema
        const Warehouse = require('../src/models/Warehouse').default;

        try {
            await mongoose.connection.collection('warehouses').dropIndex('phone_1');
            console.log('Dropped old phone index');
        } catch (e) {
            console.log('No old phone index found to drop');
        }

        const dummyWarehouses = [
            { id: 1, name: 'w1', lat: 12.9716, lng: 77.5946 }, // Bangalore
            { id: 2, name: 'w2', lat: 28.7041, lng: 77.1025 }, // Delhi
            { id: 3, name: 'w3', lat: 19.0760, lng: 72.8777 }, // Mumbai
            { id: 4, name: 'w4', lat: 13.0827, lng: 80.2707 }, // Chennai
            { id: 5, name: 'w5', lat: 22.5726, lng: 88.3639 }, // Kolkata
        ];

        for (const data of dummyWarehouses) {
            const email = `manager@${data.name}.com`;
            // Check if exists
            const existing = await Warehouse.findOne({ email });
            if (existing) {
                console.log(`Warehouse ${data.name} already exists. Skipping...`);
                continue;
            }

            await Warehouse.create({
                warehouseName: `Warehouse ${data.name.toUpperCase()}`,
                managerName: `Manager ${data.name.toUpperCase()}`,
                mobile: `999999990${data.id}`,
                email: email,
                password: 'password123',
                storeName: `Zeto-Mart ${data.name.toUpperCase()} Hub`,
                address: `${data.name.toUpperCase()} Hub Address, City`,
                location: { type: "Point", coordinates: [data.lng, data.lat] },
                status: "ACTIVE",
                role: "warehouse"
            });
            console.log(`Created Warehouse ${data.name.toUpperCase()}`);
        }

        console.log('Warehouse seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding warehouses:', error);
        process.exit(1);
    }
};

createDummyWarehouses();
