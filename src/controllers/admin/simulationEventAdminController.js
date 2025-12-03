import { SimulationEvent } from "../../models/simulationEvent.js";
import Team from "../../models/team.js";
import MatchSimulation from "../../models/matchSimulation.js";

export const listSimulationEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "50", 10);
    const offset = (page - 1) * limit;

    const { count, rows } = await SimulationEvent.findAndCountAll({ limit, offset, order: [["id", "DESC"]] });
    return res.json({ total: count, page, limit, events: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getSimulationEvent = async (req, res) => {
  try {
    const ev = await SimulationEvent.findByPk(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });
    return res.json({ event: ev });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createSimulationEvent = async (req, res) => {
  try {
    const { id_teams, id_match_simulations, minute, type_event, player } = req.body;
    if (!id_teams || !id_match_simulations || minute === undefined || !type_event || !player) return res.status(400).json({ message: "Missing fields" });

    const team = await Team.findByPk(id_teams);
    if (!team) return res.status(400).json({ message: "Team not found" });
    const sim = await MatchSimulation.findByPk(id_match_simulations);
    if (!sim) return res.status(400).json({ message: "Match simulation not found" });

    const ev = await SimulationEvent.create({ id_teams, id_match_simulations, minute, type_event, player });
    return res.status(201).json({ event: ev });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateSimulationEvent = async (req, res) => {
  try {
    const ev = await SimulationEvent.findByPk(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });
    await ev.update(req.body);
    return res.json({ event: ev });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteSimulationEvent = async (req, res) => {
  try {
    const ev = await SimulationEvent.findByPk(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });
    await ev.destroy();
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export default { listSimulationEvents, getSimulationEvent, createSimulationEvent, updateSimulationEvent, deleteSimulationEvent };
