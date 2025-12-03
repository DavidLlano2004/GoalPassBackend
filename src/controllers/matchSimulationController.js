import { MatchSimulation } from "../models/matchSimulation.js";
import { Match } from "../models/match.js";
import { SimulationEvent } from "../models/simulationEvent.js";

// List all match simulations
export const getMatchSimulations = async (req, res) => {
  try {
    const sims = await MatchSimulation.findAll();
    return res.json({ match_simulations: sims });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get one by id (include events)
export const getMatchSimulationById = async (req, res) => {
  try {
    const sim = await MatchSimulation.findByPk(req.params.id);
    if (!sim) return res.status(404).json({ message: "Match simulation not found" });

    const events = await SimulationEvent.findAll({ where: { id_match_simulations: sim.id } });
    return res.json({ match_simulation: sim, events });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Create (admin)
export const createMatchSimulation = async (req, res) => {
  try {
    const {
      id_matches,
      local_goals,
      visitor_goals,
      local_possession,
      visitor_possession,
      local_yellow_cards,
      visitor_yellow_cards,
      local_red_cards,
      visitor_red_cards,
      local_shots_on_goal,
      visitor_shots_on_goal,
    } = req.body;

    if (!id_matches || local_goals === undefined || visitor_goals === undefined)
      return res.status(400).json({ message: "id_matches, local_goals and visitor_goals are required" });

    const match = await Match.findByPk(id_matches);
    if (!match) return res.status(400).json({ message: "Match not found" });

    const sim = await MatchSimulation.create({
      id_matches,
      local_goals,
      visitor_goals,
      local_possession: local_possession || null,
      visitor_possession: visitor_possession || null,
      local_yellow_cards: local_yellow_cards || 0,
      visitor_yellow_cards: visitor_yellow_cards || 0,
      local_red_cards: local_red_cards || 0,
      visitor_red_cards: visitor_red_cards || 0,
      local_shots_on_goal: local_shots_on_goal || 0,
      visitor_shots_on_goal: visitor_shots_on_goal || 0,
    });

    return res.status(201).json({ match_simulation: sim });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update (admin)
export const updateMatchSimulation = async (req, res) => {
  try {
    const sim = await MatchSimulation.findByPk(req.params.id);
    if (!sim) return res.status(404).json({ message: "Match simulation not found" });

    const updatable = {};
    const fields = [
      "id_matches",
      "local_goals",
      "visitor_goals",
      "local_possession",
      "visitor_possession",
      "local_yellow_cards",
      "visitor_yellow_cards",
      "local_red_cards",
      "visitor_red_cards",
      "local_shots_on_goal",
      "visitor_shots_on_goal",
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) updatable[f] = req.body[f];
    });

    if (updatable.id_matches) {
      const match = await Match.findByPk(updatable.id_matches);
      if (!match) return res.status(400).json({ message: "Match not found" });
    }

    await sim.update(updatable);
    return res.json({ match_simulation: sim });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete (admin)
export const deleteMatchSimulation = async (req, res) => {
  try {
    const sim = await MatchSimulation.findByPk(req.params.id);
    if (!sim) return res.status(404).json({ message: "Match simulation not found" });
    await sim.destroy();
    return res.json({ message: "Match simulation deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export default {
  getMatchSimulations,
  getMatchSimulationById,
  createMatchSimulation,
  updateMatchSimulation,
  deleteMatchSimulation,
};
