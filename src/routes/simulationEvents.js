import express from "express";
import { body } from "express-validator";
import * as evController from "../controllers/simulationEventController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// Public reads
router.get("/", evController.getSimulationEvents); // optional query ?match_simulation_id=ID
router.get("/:id", evController.getSimulationEventById);

// Admin writes
router.post(
  "/",
  authenticate,
  authorizeRoles("administrador"),
  [body("id_teams").notEmpty(), body("id_match_simulations").notEmpty(), body("minute").notEmpty(), body("type_event").notEmpty(), body("player").notEmpty()],
  evController.createSimulationEvent
);

router.put("/:id", authenticate, authorizeRoles("administrador"), evController.updateSimulationEvent);
router.delete("/:id", authenticate, authorizeRoles("administrador"), evController.deleteSimulationEvent);

export default router;
