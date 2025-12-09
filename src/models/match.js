import { DataTypes } from "sequelize";
import { sequelize } from "../../db.js";
import Team from "./team.js";

export const Match = sequelize.define(
  "matches",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_team_local: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_team_visitor: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    match_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      set(value) {
        if (value && typeof value === "string" && value.includes("/")) {
          const [day, month, year] = value.split("/");
          this.setDataValue("match_date", `${year}-${month}-${day}`);
        } else {
          this.setDataValue("match_date", value);
        }
      },
    },
    match_hour: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [
          [
            "programado",
            "en_venta",
            "agotado",
            "en_curso",
            "finalizado",
            "cancelado",
          ],
        ],
      },
    },
    stadium: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    schema: "hr",
    timestamps: false,
    tableName: "matches",
  }
);

// Asoociaciones
Match.belongsTo(Team, {
  as: "local",
  foreignKey: "id_team_local",
  onDelete: "CASCADE",
});
Match.belongsTo(Team, {
  as: "visitor",
  foreignKey: "id_team_visitor",
  onDelete: "CASCADE",
});

export default Match;
