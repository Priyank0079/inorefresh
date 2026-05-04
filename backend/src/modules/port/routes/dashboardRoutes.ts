import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate, requireUserType } from '../../../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

router.get('/stats', dashboardController.getDashboardStats);
router.get('/activities', dashboardController.getRecentActivities);
router.get('/recent-requirements', dashboardController.getRecentRequirements);
router.get('/recent-offers', dashboardController.getRecentOffers);

export default router;
