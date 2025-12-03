import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import axios from "axios";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const {
    email,
    password,
    name,
    last_name,
    identification,
    identification_type,
    birthday,
    address,
    rol,
  } = req.body;

  try {
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail)
      return res.status(409).json({ message: "Email already registered" });

    const existingId = await User.findOne({ where: { identification } });
    if (existingId)
      return res
        .status(409)
        .json({ message: "Identification already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      id: uuidv4(),
      email,
      password: hashed,
      name,
      last_name,
      identification,
      identification_type,
      birthday: birthday ? birthday : null,
      address: address ? address : null,
      rol: rol ? rol : undefined,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    const { password: _, ...dataEnd } = user.toJSON();

    return res.status(201).json({
      token,
      user: dataEnd,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        last_name: user.last_name,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const googleCallback = async (req, res) => {
  const { code } = req.query;

  try {
    // 1. Intercambiar el code por token de Google
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const { id_token } = tokenRes.data;

    // 2. Decodificar info del usuario (name, email, picture)
    const googleUser = jwt.decode(id_token);

    // 3. Buscar o crear usuario
    let user = await User.findOne({ where: { email: googleUser.email } });

    if (!user) {
      user = await User.create({
        id: uuidv4(),
        email: googleUser.email,
        name: googleUser.name,
        password: uuidv4(),
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        rol: user.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Redirigir al frontend con el token
    return res.redirect(`http://localhost:5173/auth/success?token=${token}`);
  } catch (err) {
    console.error(err.response?.data || err);
    return res.status(500).json({
      success: false,
      message: "Google login error",
    });
  }
};

// Crear logout si es necesario (fronted)

// export const verifyToken = async (req, res) => {
//   const { token } = req.cookies;
//   if (!token) return res.status(401).json({ message: "Unauthorized" });
//   jwt.verify(token, TOKEN_SECRET, async (err, user) => {
//     if (err) return res.status(401).json({ message: "Unauthorized" });
//     const [userFound] = await sequelize.query(
//       `
//       SELECT *
//       FROM users
//       WHERE id = :id
//       `,
//       {
//         replacements: { id: user.id },
//         type: QueryTypes.SELECT,
//       }
//     );
//     if (!userFound) return res.status(401).json({ message: "Unauthorized" });

//     return res.status(200).json({
//       message: "User found",
//       response: userFound,
//     });
//   });
// };

export default { register, login };
