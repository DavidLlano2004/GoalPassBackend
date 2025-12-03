import { Team } from "../models/team.js";
import { v4 as uuidv4 } from "uuid";


// Crear equipo (admin)
export const createTeam = async (req, res) => {
  try {
    const { name, city, stadium, image_url ,foundation } = req.body;
    if (!name || !stadium)
      return res.status(400).json({ message: "name and stadium are required" });

    const team = await Team.create({
      id: uuidv4(),
      name,
      city: city || null,
      stadium,
      image_url: image_url || null,
      foundation: foundation || null,
    });
    return res.status(201).json({ team });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Publico: listar equipos
export const getTeams = async (req, res) => {
  try {
    const teams = await Team.findAll();
    return res.json({ teams });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Publico: obtener equipo por id
export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    return res.json({ team });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Actualizar equipo (solo admin)
export const updateTeam = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const updatable = ["name", "city", "stadium", "image_url"];
    const data = {};
    updatable.forEach((k) => {
      if (req.body[k] !== undefined) data[k] = req.body[k];
    });

    await team.update(data);
    return res.json({ team });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Eliminar equipo (solo admin)
export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    await team.destroy();
    return res.json({ message: "Team deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export default { createTeam, getTeams, getTeamById, updateTeam, deleteTeam };
