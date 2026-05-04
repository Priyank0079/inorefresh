import { Router } from "express";
import { getRequirements, updateRequirementStatus } from "../controllers/requirement.controller";
import { authenticate, requireUserType } from "../../../middleware/auth";

const router = Router();

// All requirement routes are protected for port users
router.use(authenticate);
router.use(requireUserType('Port'));

router.get("/", getRequirements);
router.patch("/:id/status", updateRequirementStatus);

export default router;
