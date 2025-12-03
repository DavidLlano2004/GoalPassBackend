import { DataTypes } from "sequelize";
import { sequelize } from "../../db.js";
import Match from "./match.js";

export const MatchSimulation = sequelize.define(
  "match_simulations",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    id_matches: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    local_goals: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    visitor_goals: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    local_possession: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    visitor_possession: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    local_yellow_cards: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    visitor_yellow_cards: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    local_red_cards: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    visitor_red_cards: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    local_shots_on_goal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    visitor_shots_on_goal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    tableName: "match_simulations",
  }
);

MatchSimulation.belongsTo(Match, { as: "match", foreignKey: "id_matches" });

export default MatchSimulation;
