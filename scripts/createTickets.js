// Script to create tickets table if it doesn't exist.
import { sequelize } from "../db.js";

const SQL = `
CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_users BIGINT NOT NULL,
  id_matches BIGINT NOT NULL,
  id_match_stand_price BIGINT,
  ticket_code VARCHAR(100) UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  state VARCHAR(20) DEFAULT 'vendido',
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");
    await sequelize.query(SQL);
    console.log("tickets table ensured");
    process.exit(0);
  } catch (err) {
    console.error("Error creating tickets table:", err);
    process.exit(1);
  }
};

run();
