import { Router } from "express";
import { getDashboardStats } from "../modules/warehouse/controllers/dashboardController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// All routes require authentication and warehouse user type
router.use(authenticate);
router.use(requireUserType("Warehouse"));

// Get warehouse's dashboard statistics
router.get("/stats", getDashboardStats);

export default router;
