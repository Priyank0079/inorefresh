import { Router } from "express";
import {
  getInwardStocks,
  getInwardStockById,
  addInwardStock,
  updateInwardStock,
  updateInwardStockStatus,
  deleteInwardStock,
} from "../modules/warehouse/controllers/inwardStockController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// All routes require authentication and warehouse user type
router.use(authenticate);
router.use(requireUserType("Warehouse"));

router.get("/", getInwardStocks);
router.get("/:id", getInwardStockById);
router.post("/", addInwardStock);
router.put("/:id", updateInwardStock);
router.patch("/:id/status", updateInwardStockStatus);
router.delete("/:id", deleteInwardStock);

export default router;
