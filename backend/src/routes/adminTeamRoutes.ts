import { Router } from "express";
import { authenticate, requireUserType, requireAdminRole } from "../middleware/auth";
import * as teamController from "../modules/admin/controllers/adminTeamController";

const router = Router();

router.use(authenticate);
router.use(requireUserType("Admin"));
router.use(requireAdminRole);

router.get("/", teamController.getTeamMembers);
router.post("/", teamController.createTeamMember);
router.put("/:id", teamController.updateTeamMember);
router.patch("/:id/permissions", teamController.updatePermissions);
router.patch("/:id/status", teamController.toggleStatus);
router.delete("/:id", teamController.deleteTeamMember);

export default router;
