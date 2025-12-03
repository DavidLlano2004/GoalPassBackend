import express from "express";
import { body } from "express-validator";
import * as matchSimController from "../controllers/matchSimulationController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// Public reads
router.get("/", matchSimController.getMatchSimulations);
router.get("/:id", matchSimController.getMatchSimulationById);

// Admin writes
router.post(
  "/",
  authenticate,
  authorizeRoles("administrador"),
  [body("id_matches").notEmpty(), body("local_goals").notEmpty(), body("visitor_goals").notEmpty()],
  matchSimController.createMatchSimulation
);

router.put("/:id", authenticate, authorizeRoles("administrador"), matchSimController.updateMatchSimulation);
router.delete("/:id", authenticate, authorizeRoles("administrador"), matchSimController.deleteMatchSimulation);

export default router;
