import express from "express";
import { body } from "express-validator";
import * as ticketController from "../controllers/ticketController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// Public: none - tickets are user-specific; require authentication for most reads
router.get("/me", authenticate, ticketController.getMyTickets);

// Admin
router.get("/", authenticate, authorizeRoles("administrador"), ticketController.getTickets);
router.get("/:id", authenticate, ticketController.getTicketById); // owner or admin
router.get("/match/:matchId", authenticate, ticketController.getMatchOccupancy); // owner or admin
router.get("/match/:matchId/stands-summary", authenticate, ticketController.getMatchStandsSummary); // owner or admin
router.post(
  "/",
  authenticate,
  [body("id_users").notEmpty(), body("id_matches").notEmpty(), body("price").notEmpty()],
  ticketController.createTicket
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("administrador"),
  ticketController.updateTicket
);

router.delete("/:id", authenticate, authorizeRoles("administrador"), ticketController.deleteTicket);

export default router;
