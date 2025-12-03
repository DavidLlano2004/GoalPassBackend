import express from "express";
import { body } from "express-validator";
import * as userController from "../controllers/userController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// Endpoints usuario
router.get("/me", authenticate, userController.getMe);

router.put(
  "/me",
  authenticate,
  [body("password").optional().isLength({ min: 6 }).withMessage("Password must be at least 6 chars")],
  userController.updateMe
);

router.delete("/me", authenticate, userController.deleteMe);

// Endpoints de administrador
router.get("/", authenticate, authorizeRoles("administrador"), userController.getAllUsers);
router.get("/:id", authenticate, authorizeRoles("administrador"), userController.getUserById);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("administrador"),
  [body("password").optional().isLength({ min: 6 }).withMessage("Password must be at least 6 chars")],
  userController.updateUserById
);

router.delete("/:id", authenticate, authorizeRoles("administrador"), userController.deleteUserById);

export default router;
