/**
 * Manual test for the corrected Return → Refund → Wallet flow.
 *
 * It creates fully ISOLATED throwaway documents (all marked with TEST_RETURN_FLOW),
 * runs the REAL shared refund engine (executeReturnRefund), asserts the money math,
 * checks idempotency, and then DELETES everything it created.
 *
 * Run:  npx tsx src/scripts/testReturnRefundFlow.ts
 *
 * Scenario: ordered 10 kg @ ₹20/kg (₹200) + 18% GST (₹36). Retailer keeps 4 kg,
 * returns 6 kg. Expected refund = 6×20 (120) + GST share 36×6/10 (21.6) = ₹141.6.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import Customer from '../models/Customer';
import Warehouse from '../models/Warehouse';
import Return from '../models/Return';
import WalletTransaction from '../models/WalletTransaction';
import { executeReturnRefund } from '../controllers/returnWorkflowController';

const TAG = 'TEST_RETURN_FLOW';
let pass = 0;
let fail = 0;
function check(label: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log(`  ✅ ${label} ${extra}`); }
  else { fail++; console.log(`  ❌ ${label} ${extra}`); }
}
const approx = (a: number, b: number) => Math.abs(a - b) < 0.011;

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);
  console.log('Connected. Creating isolated test data...\n');

  const ids: { model: any; id: any }[] = [];
  const track = (model: any, doc: any) => { ids.push({ model, id: doc._id }); return doc; };

  try {
    const rnd = Date.now().toString().slice(-9);

    const warehouse = track(Warehouse, await Warehouse.create({
      warehouseName: `${TAG}_WH`, managerName: 'Test Manager', mobile: '9' + rnd,
      email: `wh_${rnd}@test.local`, password: 'Test@123', address: 'Test Addr',
      location: { type: 'Point', coordinates: [72.0, 21.0] }, balance: 1000,
    }));

    const customer = track(Customer, await Customer.create({
      name: `${TAG}_Retailer`, phone: rnd.padStart(10, '8'), walletAmount: 0,
    }));

    // No real Product needed — the refund engine only uses the product id
    // reference (to look up Inventory, which won't exist here → safely skipped).
    const productId = new mongoose.Types.ObjectId();

    const order = track(Order, await Order.create({
      orderNumber: `${TAG}-${rnd}`, customer: customer._id, customerName: 'Test Retailer',
      customerPhone: '9999999999',
      deliveryAddress: { address: 'Test', city: 'Test', pincode: '360001' },
      subtotal: 200, tax: 36, discount: 0, total: 236, paymentMethod: 'COD',
      paymentStatus: 'Paid', status: 'Delivered',
      taxBreakdown: [{ itemId: productId, itemName: `${TAG}_Fish`, taxRate: 18, amount: 36 }],
      assignedWarehouse: warehouse._id,
    } as any));

    const orderItem = track(OrderItem, await OrderItem.create({
      order: order._id, product: productId, warehouse: warehouse._id,
      productName: `${TAG}_Fish`, unitPrice: 20, quantity: 10, total: 200,
    }));

    const ret = track(Return, await Return.create({
      order: order._id, orderItem: orderItem._id, customer: customer._id,
      reason: 'Damaged', quantity: 6, acceptedQuantity: 4, orderedQuantity: 10,
      status: 'IN_TRANSIT_TO_WAREHOUSE', warehouse: warehouse._id,
    }));

    // ── Run the REAL refund engine ──────────────────────────────────────────
    console.log('Running executeReturnRefund() ...\n');
    const result = await executeReturnRefund((ret._id as any).toString());

    console.log('--- Refund amount (expected ₹141.60: 120 base + 21.60 GST) ---');
    check('refundAmount = 141.60', approx(result.refundAmount, 141.6), `(got ${result.refundAmount})`);

    const cust = await Customer.findById(customer._id);
    const wh = await Warehouse.findById(warehouse._id);
    const updatedRet = await Return.findById(ret._id);

    console.log('\n--- Wallet movements ---');
    check('retailer wallet +141.60', approx(cust!.walletAmount, 141.6), `(got ${cust!.walletAmount})`);
    check('warehouse balance -141.60 (1000 → 858.40)', approx(wh!.balance, 858.4), `(got ${wh!.balance})`);
    check('return status = REFUNDED', updatedRet!.status === 'REFUNDED');

    const ledger = await WalletTransaction.find({ relatedOrder: order._id });
    track(WalletTransaction, { _id: { $in: ledger.map(l => l._id) } } as any); // mark for cleanup (handled below)
    const credit = ledger.find(l => l.type === 'Credit');
    const debit = ledger.find(l => l.type === 'Debit');
    console.log('\n--- Ledger rows (correct schema fields) ---');
    check('retailer Credit row exists w/ userId+userType', !!credit && !!(credit as any).userId && (credit as any).userType === 'CUSTOMER');
    check('warehouse Debit row exists w/ userId+userType', !!debit && !!(debit as any).userId && (debit as any).userType === 'Warehouse');

    // ── Idempotency: second call must NOT pay again ──────────────────────────
    console.log('\n--- Idempotency (second refund must be blocked) ---');
    let blocked = false;
    try { await executeReturnRefund((ret._id as any).toString()); }
    catch (e: any) { blocked = e?.message === 'ALREADY_REFUNDED'; }
    check('second refund blocked (ALREADY_REFUNDED)', blocked);
    const custAfter = await Customer.findById(customer._id);
    check('wallet unchanged after 2nd attempt (still 141.60)', approx(custAfter!.walletAmount, 141.6), `(got ${custAfter!.walletAmount})`);

    // cleanup ledger rows
    await WalletTransaction.deleteMany({ relatedOrder: order._id });
  } finally {
    // ── Cleanup: delete everything we created ───────────────────────────────
    console.log('\nCleaning up test data...');
    for (const { model, id } of ids) {
      try { if (id && !(id as any).$in) await model.deleteOne({ _id: id }); } catch { /* ignore */ }
    }
    await WalletTransaction.deleteMany({ description: { $regex: TAG } });
    await mongoose.disconnect();
  }

  console.log(`\n===== RESULT: ${pass} passed, ${fail} failed =====`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('TEST CRASHED:', e); process.exit(1); });
