// Script to create soccer_stands table if it doesn't exist.
import { sequelize } from "../db.js";

const SQL = `
CREATE TABLE IF NOT EXISTS soccer_stands (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  total_capacity INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");
    await sequelize.query(SQL);
    console.log("soccer_stands table ensured");
    process.exit(0);
  } catch (err) {
    console.error("Error creating soccer_stands table:", err);
    process.exit(1);
  }
};

run();
