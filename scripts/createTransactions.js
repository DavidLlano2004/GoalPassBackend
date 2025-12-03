// Script to create transactions table if it doesn't exist.
import { sequelize } from "../db.js";

const SQL = `
CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_users BIGINT NOT NULL,
  id_matches BIGINT,
  total_amount DECIMAL(12,2) NOT NULL,
  number_tickets INT NOT NULL DEFAULT 1,
  payment_method VARCHAR(50),
  reference VARCHAR(150),
  currency VARCHAR(10) DEFAULT 'COP',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");
    await sequelize.query(SQL);
    console.log("transactions table ensured");
    process.exit(0);
  } catch (err) {
    console.error("Error creating transactions table:", err);
    process.exit(1);
  }
};

run();
