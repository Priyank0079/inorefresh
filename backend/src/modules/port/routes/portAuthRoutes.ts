import { Router } from "express";
import * as portAuthController from "../controllers/portAuthController";
import { otpRateLimiter, loginRateLimiter } from "../../../middleware/rateLimiter";

import { authenticate, requireUserType } from "../../../middleware/auth";

const router = Router();

// Public routes
router.post("/send-otp", otpRateLimiter, portAuthController.sendOTP);
router.post("/verify-otp", loginRateLimiter, portAuthController.verifyOTP);
router.post("/register", portAuthController.register);

// Protected routes
router.get("/profile", authenticate, requireUserType("Port"), portAuthController.getProfile);
router.put("/profile", authenticate, requireUserType("Port"), portAuthController.updateProfile);

export default router;
