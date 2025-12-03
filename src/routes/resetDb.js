import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";
import { resetDatabase } from "../controllers/resetDBController.js";

const router = express.Router();

// Endpoints de administrador
router.post(
  "/",
  authenticate,
  resetDatabase
);


export default router;
