import { SoccerStand } from "../models/soccerStand.js";
import { v4 as uuidv4 } from "uuid";

export const createStand = async (req, res) => {
  try {
    const { name, total_capacity, description } = req.body;
    if (!name || total_capacity === undefined)
      return res
        .status(400)
        .json({ message: "name and total_capacity are required" });

    const stand = await SoccerStand.create({
      id: uuidv4(),
      name,
      total_capacity,
      description: description || null,
    });
    return res.status(201).json({ stand });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getStands = async (req, res) => {
  try {
    const stands = await SoccerStand.findAll();
    return res.json({ stands });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getStandById = async (req, res) => {
  try {
    const stand = await SoccerStand.findByPk(req.params.id);
    if (!stand) return res.status(404).json({ message: "Stand not found" });
    return res.json({ stand });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateStand = async (req, res) => {
  try {
    const stand = await SoccerStand.findByPk(req.params.id);
    if (!stand) return res.status(404).json({ message: "Stand not found" });

    const updatable = {};
    const { name, total_capacity, description } = req.body;
    if (name !== undefined) updatable.name = name;
    if (total_capacity !== undefined) updatable.total_capacity = total_capacity;
    if (description !== undefined) updatable.description = description;

    await stand.update(updatable);
    return res.json({ stand });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteStand = async (req, res) => {
  try {
    const stand = await SoccerStand.findByPk(req.params.id);
    if (!stand) return res.status(404).json({ message: "Stand not found" });
    await stand.destroy();
    return res.json({ message: "Stand deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export default {
  createStand,
  getStands,
  getStandById,
  updateStand,
  deleteStand,
};
