import { DataTypes } from "sequelize";
import { sequelize } from "../../db.js";
import Team from "./team.js";
import MatchSimulation from "./matchSimulation.js";

export const SimulationEvent = sequelize.define(
  "simulations_events",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    id_teams: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    id_match_simulations: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    minute: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type_event: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: { isIn: [["Gol", "Tarjeta amarilla", "Tarjeta roja"]] },
    },
    player: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    tableName: "simulations_events",
  }
);

SimulationEvent.belongsTo(Team, { as: "team", foreignKey: "id_teams" });
SimulationEvent.belongsTo(MatchSimulation, { as: "match_simulation", foreignKey: "id_match_simulations" });

export default SimulationEvent;
