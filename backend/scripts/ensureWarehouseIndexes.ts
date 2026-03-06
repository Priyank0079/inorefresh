/**
 * ensureWarehouseIndexes.ts
 * Run once to ensure all geospatial and fulfillment indexes are in place.
 * Safe to run multiple times (createIndex is idempotent).
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ensureIndexes = async () => {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('MongoDB Connected...');

    const db = mongoose.connection.db!;

    // ── 1. Warehouses: 2dsphere on location ───────────────────
    try {
        await db.collection('warehouses').createIndex({ location: '2dsphere' });
        console.log('✅ warehouses.location 2dsphere index OK');
    } catch (e: any) {
        console.log('ℹ️  warehouses.location index:', e.message);
    }

    // ── 2. Products: warehouse + stock compound index ─────────
    try {
        await db.collection('products').createIndex({ warehouse: 1, stock: 1 });
        console.log('✅ products.(warehouse, stock) compound index OK');
    } catch (e: any) {
        console.log('ℹ️  products.warehouse+stock index:', e.message);
    }

    try {
        await db.collection('products').createIndex({ warehouse: 1 });
        console.log('✅ products.warehouse index OK');
    } catch (e: any) {
        console.log('ℹ️  products.warehouse index:', e.message);
    }

    // ── 3. Orders: assignedWarehouse index ────────────────────
    try {
        await db.collection('orders').createIndex({ assignedWarehouse: 1 });
        console.log('✅ orders.assignedWarehouse index OK');
    } catch (e: any) {
        console.log('ℹ️  orders.assignedWarehouse index:', e.message);
    }

    console.log('\n✅ All fulfillment indexes ensured.');
    process.exit(0);
};

ensureIndexes().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
