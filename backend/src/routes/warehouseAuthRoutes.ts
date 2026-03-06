import { Router } from "express";
import * as warehouseAuthController from "../modules/warehouse/controllers/warehouseAuthController";
import { otpRateLimiter, loginRateLimiter } from "../middleware/rateLimiter";
import { authenticate } from "../middleware/auth";

const router = Router();

// Login route with email and password
router.post("/login", loginRateLimiter, warehouseAuthController.login);

// Register route
router.post("/register", warehouseAuthController.register);

// Profile routes (protected)
router.get("/profile", authenticate, warehouseAuthController.getProfile);
router.put("/profile", authenticate, warehouseAuthController.updateProfile);
router.put("/toggle-shop-status", authenticate, warehouseAuthController.toggleShopStatus);

export default router;
