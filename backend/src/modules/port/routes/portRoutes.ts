import { Router } from 'express';
import dashboardRoutes from './dashboardRoutes';
// Import other routes as they are created
import requirementRoutes from './requirementRoutes';
import offerRoutes from './offerRoutes';
import productRoutes from './productRoutes';
import notificationRoutes from './notificationRoutes';

import { authenticate, requireUserType } from '../../../middleware/auth';
import { getWarehousePortOrders } from '../controllers/offer.controller';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.get('/warehouse-orders', authenticate, requireUserType('Warehouse', 'Admin'), getWarehousePortOrders);
router.use('/requirements', requirementRoutes);
router.use('/offers', offerRoutes);
router.use('/products', productRoutes);
router.use('/notifications', notificationRoutes);

// Debug route to verify mounting
router.get('/test', (req, res) => {
  res.json({ success: true, message: "Port sub-router is working" });
});


export default router;
