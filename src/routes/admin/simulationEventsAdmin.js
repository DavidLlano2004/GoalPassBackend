import express from "express";
import { body } from "express-validator";
import * as adminCtrl from "../../controllers/admin/simulationEventAdminController.js";
import { authenticate, authorizeRoles } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/", authenticate, authorizeRoles("administrador"), adminCtrl.listSimulationEvents);
router.get("/:id", authenticate, authorizeRoles("administrador"), adminCtrl.getSimulationEvent);

router.post(
  "/",
  authenticate,
  authorizeRoles("administrador"),
  [body("id_teams").notEmpty(), body("id_match_simulations").notEmpty(), body("minute").notEmpty(), body("type_event").notEmpty(), body("player").notEmpty()],
  adminCtrl.createSimulationEvent
);

router.put("/:id", authenticate, authorizeRoles("administrador"), adminCtrl.updateSimulationEvent);
router.delete("/:id", authenticate, authorizeRoles("administrador"), adminCtrl.deleteSimulationEvent);

export default router;
