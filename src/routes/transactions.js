import express from "express";
import { body } from "express-validator";
import * as transactionController from "../controllers/transactionController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// User endpoints
router.post(
  "/",
  authenticate,
  [body("total_amount").notEmpty().withMessage("total_amount required")],
  transactionController.createTransaction
);

router.get("/me", authenticate, transactionController.getMyTransactions);

router.get(
  "/details/:id",
  authenticate,
  transactionController.getTransactionDetails
);

// Admin endpoints
router.get(
  "/",
  authenticate,
  authorizeRoles("administrador"),
  transactionController.getTransactions
);
router.get("/:id", authenticate, transactionController.getTransactionById); // owner or admin
router.put(
  "/:id",
  authenticate,
  authorizeRoles("administrador"),
  transactionController.updateTransaction
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("administrador"),
  transactionController.deleteTransaction
);

export default router;
