import express from "express";
import { body } from "express-validator";
import * as adminCtrl from "../../controllers/admin/matchSimulationAdminController.js";
import { authenticate, authorizeRoles } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/", authenticate, authorizeRoles("administrador"), adminCtrl.listMatchSimulations);
router.get("/:id", authenticate, authorizeRoles("administrador"), adminCtrl.getMatchSimulation);

router.post(
  "/",
  authenticate,
  authorizeRoles("administrador"),
  [body("id_matches").notEmpty(), body("local_goals").notEmpty(), body("visitor_goals").notEmpty()],
  adminCtrl.createMatchSimulation
);

router.put("/:id", authenticate, authorizeRoles("administrador"), adminCtrl.updateMatchSimulation);
router.delete("/:id", authenticate, authorizeRoles("administrador"), adminCtrl.deleteMatchSimulation);

export default router;
