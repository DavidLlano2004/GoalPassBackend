import bcrypt from "bcrypt";
import { User } from "../models/user.js";


// Ayudante para eliminar campos sensibles
const sanitize = (user) => {
  if (!user) return null;
  const u = { ...user.dataValues };
  delete u.password;
  return u;
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user: sanitize(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Actualizar mis datos
export const updateMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updatable = ["name", "last_name", "birthday", "address", "password" , "email", "identification", "identification_type"];
    const data = {};
    updatable.forEach((k) => {
      if (req.body[k] !== undefined) data[k] = req.body[k];
    });

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    await user.update(data);
    return res.json({ user: sanitize(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" , error:err });
  }
};

// Eliminar mi usuario
export const deleteMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.destroy();
    return res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Acciones de administrador
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    return res.json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user: sanitize(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Allow admin to update common fields and role
    const updatable = ["name", "last_name", "birthday", "address", "password", "rol", "email", "identification", "identification_type"];
    const data = {};
    updatable.forEach((k) => {
      if (req.body[k] !== undefined) data[k] = req.body[k];
    });

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    await user.update(data);
    return res.json({ user: sanitize(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" , error:err });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.destroy();
    return res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export default {
  getMe,
  updateMe,
  deleteMe,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};
