import { DataTypes } from "sequelize";
import { sequelize } from "../../db.js";
import User from "./user.js";
import Match from "./match.js";
import MatchStandPrice from "./matchStandPrice.js";
import Transaction from "./transaction.js";

export const Ticket = sequelize.define(
  "tickets",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_users: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_matches: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_match_stand_price: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    ticket_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    row: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    seat: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_transaction: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "vendido",
      validate: { isIn: [["pendiente", "vendido", "anulado", "usado"]] },
    },
    purchased_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    schema: "hr",
    timestamps: false,
    tableName: "tickets",
    getterMethods: {
      seat_info() {
        return this.row && this.seat
          ? `Fila ${this.row} - Asiento ${this.seat}`
          : null;
      },
    },
  }
);

Ticket.belongsTo(User, { as: "user", foreignKey: "id_users" });
Ticket.belongsTo(Match, { as: "match", foreignKey: "id_matches" });
Ticket.belongsTo(MatchStandPrice, {
  as: "msp",
  foreignKey: "id_match_stand_price",
});

Ticket.belongsTo(Transaction, {
  as: "transaction",
  foreignKey: "id_transaction",
});

export default Ticket;
