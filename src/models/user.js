import { DataTypes } from "sequelize";
import { sequelize } from "../../db.js";

export const User = sequelize.define(
  "users",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    identification: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    identification_type: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: { isIn: [["CC", "TI"]] },
    },
    rol: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "usuario",
      validate: { isIn: [["administrador", "usuario"]] },
    },
    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
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
    tableName: "users",
  }
);

export default User;
