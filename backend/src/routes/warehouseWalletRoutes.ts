import { Router } from 'express';
import { authenticate, requireUserType } from '../middleware/auth';
import {
    getBalance,
    getTransactions,
    requestWithdrawal,
    getWithdrawals,
    getCommissions,
} from '../modules/warehouse/controllers/warehouseWalletController';

const router = Router();

// All routes require warehouse authentication
router.use(authenticate, requireUserType('Warehouse'));

// Wallet balance
router.get('/balance', getBalance);

// Wallet transactions
router.get('/transactions', getTransactions);

// Withdrawal requests
router.post('/withdraw', requestWithdrawal);
router.get('/withdrawals', getWithdrawals);

// Commission earnings
router.get('/commissions', getCommissions);

export default router;
