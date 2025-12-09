import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";
import { getReportStatsOptimized } from "../controllers/reportsController.js";
import { getDashboardStatsOptimized } from "../controllers/dashboardController.js";

const router = express.Router();

// Endpoints de administrador
router.get(
  "/",
  authenticate,
  authorizeRoles("administrador"),
  getDashboardStatsOptimized
);


export default router;
