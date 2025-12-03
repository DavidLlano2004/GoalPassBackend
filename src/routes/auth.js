import express from "express";
import { body } from "express-validator";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("name").isLength({ min: 2 }).withMessage("Name required"),
    body("last_name").isLength({ min: 2 }).withMessage("Last name required"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 chars"),
    body("identification").isLength({ min: 4 }).withMessage("Identification required"),
    body("identification_type").isIn(["CC", "TI"]).withMessage("identification_type must be CC or TI"),
  ],
  register
);

router.post(
  "/login",
  [body("email").isEmail().withMessage("Invalid email"), body("password").notEmpty().withMessage("Password required")],
  login
);

export default router;
