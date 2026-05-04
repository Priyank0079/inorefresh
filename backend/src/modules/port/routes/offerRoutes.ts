import { Router } from "express";
import { 
  getMyNegotiations, 
  getMyOrders,
  getOfferById,
  createOffer, 
  acceptCounter, 
  counterOffer,
  adminGetAllOffers,
  adminCounterOffer,
  adminConfirmOffer
} from "../controllers/offer.controller";
import { authenticate, requireUserType, requireAdminAuth } from "../../../middleware/auth";

const router = Router();

// All offer routes require authentication
router.use(authenticate);

// Admin specific negotiation routes - Moved to top to avoid any parameter conflicts
router.get("/admin/all", requireAdminAuth, adminGetAllOffers);
router.post("/admin/:offerId/counter", requireAdminAuth, adminCounterOffer);
router.post("/admin/:offerId/confirm", requireAdminAuth, adminConfirmOffer);

// Port specific routes
router.get("/my-negotiations", requireUserType('Port'), getMyNegotiations);
router.get("/my-orders", requireUserType('Port'), getMyOrders);
router.get("/:offerId", requireUserType('Port'), getOfferById);
router.post("/", requireUserType('Port'), createOffer);
router.post("/:offerId/accept-counter", requireUserType('Port'), acceptCounter);
router.post("/:offerId/counter", requireUserType('Port'), counterOffer);

export default router;
