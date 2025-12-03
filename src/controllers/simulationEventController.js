import { SimulationEvent } from "../models/simulationEvent.js";
import Team from "../models/team.js";
import MatchSimulation from "../models/matchSimulation.js";

// List events (optionally by match_simulation id)
export const getSimulationEvents = async (req, res) => {
  try {
    const where = {};
    if (req.query.match_simulation_id) where.id_match_simulations = req.query.match_simulation_id;
    const events = await SimulationEvent.findAll({ where });
    return res.json({ events });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get event by id
export const getSimulationEventById = async (req, res) => {
  try {
    const ev = await SimulationEvent.findByPk(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });
    return res.json({ event: ev });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Create event (admin)
export const createSimulationEvent = async (req, res) => {
  try {
    const { id_teams, id_match_simulations, minute, type_event, player } = req.body;
    if (!id_teams || !id_match_simulations || minute === undefined || !type_event || !player)
      return res.status(400).json({ message: "id_teams, id_match_simulations, minute, type_event and player are required" });

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

// Update event (admin)
export const updateSimulationEvent = async (req, res) => {
  try {
    const ev = await SimulationEvent.findByPk(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });

    const updatable = {};
    const fields = ["id_teams", "id_match_simulations", "minute", "type_event", "player"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) updatable[f] = req.body[f];
    });

    if (updatable.id_teams) {
      const team = await Team.findByPk(updatable.id_teams);
      if (!team) return res.status(400).json({ message: "Team not found" });
    }
    if (updatable.id_match_simulations) {
      const sim = await MatchSimulation.findByPk(updatable.id_match_simulations);
      if (!sim) return res.status(400).json({ message: "Match simulation not found" });
    }

    await ev.update(updatable);
    return res.json({ event: ev });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete event (admin)
export const deleteSimulationEvent = async (req, res) => {
  try {
    const ev = await SimulationEvent.findByPk(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });
    await ev.destroy();
    return res.json({ message: "Event deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export default { getSimulationEvents, getSimulationEventById, createSimulationEvent, updateSimulationEvent, deleteSimulationEvent };
