import { Router } from "express";
import { getSalesReport } from "../modules/warehouse/controllers/reportController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// All routes require authentication and warehouse user type
router.use(authenticate);
router.use(requireUserType("Warehouse"));

// Get warehouse's sales report
router.get("/sales", getSalesReport);

export default router;
