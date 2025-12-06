import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";
import { getReportStatsOptimized } from "../controllers/reportsController.js";

const router = express.Router();

// Endpoints de administrador
router.get(
  "/",
  authenticate,
  authorizeRoles("administrador"),
  getReportStatsOptimized
);


export default router;
