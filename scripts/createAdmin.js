import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { sequelize } from '../db.js';
import User from '../src/models/user.js';

const argv = process.argv.slice(2);
const email = argv[0] || 'admin@example.com';
const plainPassword = argv[1] || 'AdminPass123!';
const name = argv[2] || 'Admin';
const last_name = argv[3] || 'Root';
const identification = argv[4] || `id_${Date.now()}`;
const identification_type = argv[5] || 'CC';
const rol = argv[6] || 'administrador';
const birthday = argv[7] || null;
const address = argv[8] || 'Oficina central';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const byEmail = await User.findOne({ where: { email } });
    if (byEmail) {
      console.log('User with that email already exists:', email);
      process.exit(0);
    }

    const byId = await User.findOne({ where: { identification } });
    if (byId) {
      console.log('User with that identification already exists:', identification);
      process.exit(0);
    }

    const hash = await bcrypt.hash(plainPassword, 10);

    const user = await User.create({
      email,
      password: hash,
      name,
      last_name,
      identification,
      identification_type,
      rol,
      birthday: birthday || null,
      address,
      created_at: new Date(),
    });

    console.log('Admin created:', { id: user.id, email: user.email });
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
})();
