import { DataTypes } from "sequelize";
import { sequelize } from "../../db.js";

export const SoccerStand = sequelize.define(
  "soccer_stands",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    total_capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    schema: "hr",
    timestamps: false,
    tableName: "soccer_stands",
  }
);

export default SoccerStand;
