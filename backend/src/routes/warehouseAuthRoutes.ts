import { Router } from "express";
import * as warehouseAuthController from "../modules/warehouse/controllers/warehouseAuthController";
import { otpRateLimiter, loginRateLimiter } from "../middleware/rateLimiter";
import { authenticate } from "../middleware/auth";

const router = Router();

// Send OTP route
router.post("/send-otp", otpRateLimiter, warehouseAuthController.sendOTP);

// Verify OTP and login route
router.post("/verify-otp", loginRateLimiter, warehouseAuthController.verifyOTP);

// Register route
router.post("/register", warehouseAuthController.register);

// Profile routes (protected)
router.get("/profile", authenticate, warehouseAuthController.getProfile);
router.put("/profile", authenticate, warehouseAuthController.updateProfile);
router.put("/toggle-shop-status", authenticate, warehouseAuthController.toggleShopStatus);

export default router;
