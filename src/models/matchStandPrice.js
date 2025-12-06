import { DataTypes } from "sequelize";
import { sequelize } from "../../db.js";
import Match from "./match.js";
import SoccerStand from "./soccerStand.js";

export const MatchStandPrice = sequelize.define(
  "match_stand_prices",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_match: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_stand: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    schema: "hr",
    timestamps: false,
    tableName: "match_stand_prices",
  }
);

MatchStandPrice.belongsTo(Match, {
  as: "match",
  foreignKey: "id_match",
  onDelete: "CASCADE",
});

MatchStandPrice.belongsTo(SoccerStand, {
  as: "stand",
  foreignKey: "id_stand",
  onDelete: "CASCADE",
});

export default MatchStandPrice;
