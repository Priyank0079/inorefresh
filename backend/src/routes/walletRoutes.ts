import { Router } from 'express';
import * as walletController from '../modules/warehouse/controllers/walletController';
import { authenticate, requireUserType } from '../middleware/auth';

const router = Router();

// All wallet routes require warehouse authentication
router.use(authenticate);
router.use(requireUserType('Warehouse'));

router.get('/stats', walletController.getWalletStats);
router.get('/transactions', walletController.getTransactions);
router.get('/withdrawals', walletController.getWithdrawalRequests);
router.post('/withdrawals', walletController.createWithdrawalRequest);
router.get('/earnings', walletController.getOrderEarnings);

export default router;
