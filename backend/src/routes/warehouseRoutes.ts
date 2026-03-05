import { Router } from "express";
import {
  getAllWarehouses,
  getWarehouseById,
  updateWarehouseStatus,
  updateWarehouse,
  deleteWarehouse,
} from "../modules/warehouse/controllers/warehouseController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// All routes require authentication and admin user type
router.use(authenticate);
router.use(requireUserType("Admin"));

// Get all warehouses
router.get("/", getAllWarehouses);

// Get warehouse by ID
router.get("/:id", getWarehouseById);

// Update warehouse status
router.patch("/:id/status", updateWarehouseStatus);

// Update warehouse details
router.put("/:id", updateWarehouse);

// Delete warehouse
router.delete("/:id", deleteWarehouse);

export default router;
