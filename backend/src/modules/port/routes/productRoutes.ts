import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { authenticate, requireUserType } from "../../../middleware/auth";

const router = Router();

// All product routes require authentication
router.use(authenticate);

// Explore route for Admin and Warehouse to see all port products
router.get("/explore", requireUserType("Admin", "Warehouse", "Port"), productController.exploreProducts);

// All other product routes require Port authentication
router.use(requireUserType("Port"));

router.get("/", productController.getMyProducts);
router.post("/", productController.createProduct);
router.get("/:id", productController.getProductById);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

export default router;
