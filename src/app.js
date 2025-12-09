import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import teamsRoutes from "./routes/teams.js";
import matchesRoutes from "./routes/matches.js";
import soccerStandsRoutes from "./routes/soccerStands.js";
import ticketsRoutes from "./routes/tickets.js";
import transactionsRoutes from "./routes/transactions.js";
import resetDbRoutes from "./routes/resetDb.js";
import googleRoutes from "./routes/google.js";
import reportsRoutes from "./routes/reports.js";
import dashboardRoutes from "./routes/dashboard.js";
import matchSimulationsRoutes from "./routes/matchSimulations.js";
import simulationEventsRoutes from "./routes/simulationEvents.js";
import matchSimulationsAdminRoutes from "./routes/admin/matchSimulationsAdmin.js";
import simulationEventsAdminRoutes from "./routes/admin/simulationEventsAdmin.js";
import { sequelize } from "../db.js";
import User from "./models/user.js";
import { seedInitUserAdmin } from "./seeds/auth.seed.js";
import Team from "./models/team.js";
import Match from "./models/match.js";
import SoccerStand from "./models/soccerStand.js";
import { seedInitSoccerStands } from "./seeds/soccerStand.seed.js";
import MatchStandPrice from "./models/matchStandPrice.js";
import Ticket from "./models/ticket.js";
import Transaction from "./models/transaction.js";
import SimulationEvent from "./models/simulationEvent.js";
import MatchSimulation from "./models/matchSimulation.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
// Usuarios CRUD (self + admin)
app.use("/api/users", usersRoutes);
// Equipos CRUD (lectura pública, creación/actualización/eliminación solo admin)
app.use("/api/teams", teamsRoutes);
// Partidos CRUD (lectura pública, creación/actualización/eliminación solo admin)
app.use("/api/matches", matchesRoutes);
// Soccer stands (public read, admin-only write)
app.use("/api/stands", soccerStandsRoutes);
// Tickets (user own + admin management)
app.use("/api/tickets", ticketsRoutes);
// Transactions (payments) - users can create and list their own; admin manages all
app.use("/api/transactions", transactionsRoutes);
// Match simulations and simulation events
app.use("/api/match-simulations", matchSimulationsRoutes);
app.use("/api/simulation-events", simulationEventsRoutes);
// Admin routes for simulations and events
app.use("/api/admin/match-simulations", matchSimulationsAdminRoutes);
app.use("/api/admin/simulation-events", simulationEventsAdminRoutes);

app.use("/api/reset-database", resetDbRoutes);

app.use("/api/auth/google", googleRoutes);

app.use("/api/reports", reportsRoutes);

app.use("/api/dashboard", dashboardRoutes);

const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV !== "test") {
      await User.sync({ alter: true });
      await Team.sync({ alter: true });
      await Match.sync({ alter: true });
      await SoccerStand.sync({ alter: true });
      await MatchStandPrice.sync({ alter: true });
      await Transaction.sync({ alter: true });
      await Ticket.sync({ alter: true });
      await MatchSimulation.sync({ alter: true });
      await SimulationEvent.sync({ alter: true });
      await seedInitUserAdmin();
      await seedInitSoccerStands();
    }
    console.log("Database connected");
  } catch (err) {
    console.error("Unable to connect to DB:", err);
  }
};

if (process.env.NODE_ENV !== "test") {
  testDbConnection();
}

export default app;
