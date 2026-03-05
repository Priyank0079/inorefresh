import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  updateProductStatus,
  bulkUpdateStock,
  getShops,
} from "../modules/warehouse/controllers/productController";
import { getBrands } from "../modules/admin/controllers/adminProductController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// All routes require authentication and warehouse user type
router.use(authenticate);
router.use(requireUserType("Warehouse"));

// Get all brands - warehouses need this for product creation
router.get("/brands", getBrands);

// Get all active shops - warehouses need this for shop-by-store-only products
router.get("/shops", getShops);

// Create product
router.post("/", createProduct);

// Get warehouse's products with filters
router.get("/", getProducts);

// Get product by ID
router.get("/:id", getProductById);

// Update product
router.put("/:id", updateProduct);

// Delete product
router.delete("/:id", deleteProduct);

// Update stock for a product variation
router.patch("/:id/variations/:variationId/stock", updateStock);

// Bulk update stock
router.patch("/bulk-stock-update", bulkUpdateStock);

// Update product status (publish, popular, dealOfDay)
router.patch("/:id/status", updateProductStatus);

export default router;
