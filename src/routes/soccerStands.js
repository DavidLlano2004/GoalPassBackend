import express from "express";
import { body } from "express-validator";
import * as soccerStandController from "../controllers/soccerStandController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();


router.get("/", soccerStandController.getStands);
router.get("/:id", soccerStandController.getStandById);

router.post(
  "/",
  authenticate,
  authorizeRoles("administrador"),
  [body("name").notEmpty().withMessage("name required"), body("total_capacity").isInt({ min: 0 }).withMessage("total_capacity required")],
  soccerStandController.createStand
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("administrador"),
  [body("total_capacity").optional().isInt({ min: 0 })],
  soccerStandController.updateStand
);

router.delete("/:id", authenticate, authorizeRoles("administrador"), soccerStandController.deleteStand);

export default router;
