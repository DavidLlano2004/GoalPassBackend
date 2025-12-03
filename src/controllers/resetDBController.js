
import { sequelize } from "../../db.js";
import Match from "../models/match.js";
import MatchStandPrice from "../models/matchStandPrice.js";
import SoccerStand from "../models/soccerStand.js";
import Team from "../models/team.js";
import Ticket from "../models/ticket.js";
import Transaction from "../models/transaction.js";
import User from "../models/user.js";
import { seedInitUserAdmin } from "../seeds/auth.seed.js";
import { seedInitSoccerStands } from "../seeds/soccerStand.seed.js";

export const resetDatabase = async (req, res) => {
  try {

    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "Database reset is not allowed in production",
      });
    }

    console.log("Iniciando reset de base de datos...");

    // Deshabilitar constraints temporalmente
    await sequelize.query("SET session_replication_role = replica;");

    // Vaciar todas las tablas en orden (por las foreign keys)
    await Ticket.destroy({ where: {}, force: true });
    await MatchStandPrice.destroy({ where: {}, force: true });
    await Match.destroy({ where: {}, force: true });
    await Team.destroy({ where: {}, force: true });
    await SoccerStand.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await Transaction.destroy({ where: {}, force: true });

    console.log("✅ Tablas vaciadas");

    // Rehabilitar constraints
    await sequelize.query("SET session_replication_role = DEFAULT;");

    await seedInitUserAdmin();
    await seedInitSoccerStands();

    console.log("Base de datos reseteada exitosamente");

    return res.json({
      success: true,
      message: "Database reset successfully",
      data: {
        admin_created: true,
        soccer_stands_created: true,
      },
    });
  } catch (error) {
    console.error("Error resetting database:", error);
    return res.status(500).json({
      success: false,
      message: "Error resetting database",
      error: error.message,
    });
  }
};
