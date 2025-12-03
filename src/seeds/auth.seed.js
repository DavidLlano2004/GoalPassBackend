import bcrypt from "bcrypt";
import User from "../models/user.js";

export const seedInitUserAdmin = async () => {
  try {
    const count = await User.count();
    if (count === 0) {
      const passwordHash = await bcrypt.hash("admin1234", 10);

      await User.create({
        email: "admin@gmail.com",
        name: "Admin",
        last_name: "User",
        identification: "1107974183",
        identification_type: "CC",
        rol: "administrador",
        birthday: "2004/01/17",
        address: "Carrera 8c #",
        password: passwordHash,
      });

      console.log("✅ Usuario administrador creado con Sequelize");
    }
  } catch (error) {
    console.error("Error al inicializar el usuario admin:", error);
  }
};
