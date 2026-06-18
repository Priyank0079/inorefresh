import { Router } from "express";
import * as routeController from "../modules/warehouse/controllers/routeController";

/**
 * Route-based logistics planning endpoints (Phase 2).
 * Mounted at /api/v1/routes and gated to Warehouse + Admin in routes/index.ts.
 */
const router = Router();

router.get("/unplanned-orders", routeController.getUnplannedOrders);
router.get("/drivers", routeController.getDrivers);
router.post("/confirm-order/:orderId", routeController.confirmOrder);

router.get("/live-tracking", routeController.getLiveTracking);
router.post("/", routeController.createRoute);
router.get("/", routeController.getRoutes);
router.get("/:id", routeController.getRouteById);
router.put("/:id", routeController.updateRoute);

export default router;
