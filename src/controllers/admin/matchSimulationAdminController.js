import { MatchSimulation } from "../../models/matchSimulation.js";
import { Match } from "../../models/match.js";
import { SimulationEvent } from "../../models/simulationEvent.js";

// Admin list with pagination and include events + match
export const listMatchSimulations = async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const offset = (page - 1) * limit;

    const { count, rows } = await MatchSimulation.findAndCountAll({
      limit,
      offset,
      order: [["id", "DESC"]],
    });

    // load events per simulation
    const ids = rows.map((r) => r.id);
    const events = await SimulationEvent.findAll({ where: { id_match_simulations: ids } });

    return res.json({ total: count, page, limit, match_simulations: rows, events });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMatchSimulation = async (req, res) => {
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

export const createMatchSimulation = async (req, res) => {
  try {
    // reuse existing controller logic lightly: validate match exists
    const { id_matches, local_goals, visitor_goals } = req.body;
    if (!id_matches || local_goals === undefined || visitor_goals === undefined) return res.status(400).json({ message: "id_matches, local_goals and visitor_goals are required" });
    const match = await Match.findByPk(id_matches);
    if (!match) return res.status(400).json({ message: "Match not found" });

    const sim = await MatchSimulation.create(req.body);
    return res.status(201).json({ match_simulation: sim });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateMatchSimulation = async (req, res) => {
  try {
    const sim = await MatchSimulation.findByPk(req.params.id);
    if (!sim) return res.status(404).json({ message: "Match simulation not found" });
    await sim.update(req.body);
    return res.json({ match_simulation: sim });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteMatchSimulation = async (req, res) => {
  try {
    const sim = await MatchSimulation.findByPk(req.params.id);
    if (!sim) return res.status(404).json({ message: "Match simulation not found" });
    await sim.destroy();
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export default { listMatchSimulations, getMatchSimulation, createMatchSimulation, updateMatchSimulation, deleteMatchSimulation };
