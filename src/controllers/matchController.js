import { Match } from "../models/match.js";
import MatchStandPrice from "../models/matchStandPrice.js";
import SoccerStand from "../models/soccerStand.js";
import { Team } from "../models/team.js";
import { v4 as uuidv4 } from "uuid";

const VALID_STATES = [
  "programado",
  "en_venta",
  "agotado",
  "en_curso",
  "finalizado",
  "cancelado",
];

const createPricesForMatch = async (matchId) => {
  try {
    const stands = await SoccerStand.findAll();

    if (stands.length === 0) {
      throw new Error(
        "No existen tribunas en la base de datos. Ejecuta el seeder primero."
      );
    }

    const getPriceByStandName = (name) => {
      const prices = {
        Occidental: 80000,
        Oriental: 70000,
        Norte: 40000,
        Sur: 45000,
      };
      return prices[name] || 50000;
    };

    const pricesData = stands.map((stand) => ({
      id_match: matchId,
      id_stand: stand.id,
      price: getPriceByStandName(stand.name),
    }));

    await MatchStandPrice.bulkCreate(pricesData);

    return pricesData;
  } catch (error) {
    console.error("Error al crear precios:", error);
    throw error;
  }
};

export const createMatch = async (req, res) => {
  try {
    const {
      id_team_local,
      id_team_visitor,
      match_date,
      match_hour,
      state,
      stadium,
    } = req.body;

    if (!id_team_local || !id_team_visitor)
      return res
        .status(400)
        .json({ message: "id_team_local and id_team_visitor are required" });
    if (id_team_local === id_team_visitor)
      return res
        .status(400)
        .json({ message: "Local and visitor teams must be different" });
    if (state && !VALID_STATES.includes(state))
      return res.status(400).json({ message: "Invalid state" });

    // Ensure teams exist
    const local = await Team.findByPk(id_team_local);
    const visitor = await Team.findByPk(id_team_visitor);
    if (!local || !visitor)
      return res.status(400).json({ message: "One or both teams not found" });

    const createMatch = await Match.create({
      id: uuidv4(),
      id_team_local,
      id_team_visitor,
      match_date: match_date || null,
      match_hour: match_hour || null,
      state: state || null,
      stadium: stadium,
    });

    await createPricesForMatch(createMatch.id);

    const match = await Match.findByPk(createMatch.id, {
      include: [{ association: "local" }, { association: "visitor" }],
    });

    return res.status(201).json({ match });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMatches = async (req, res) => {
  try {
    const matchesStart = await Match.findAll({
      include: [{ association: "local" }, { association: "visitor" }],
    });

    const matchStandPrices = await MatchStandPrice.findAll({
      include: [{ association: "stand" }],
    });

    // Unir precios a cada match
    const matches = matchesStart.map((match) => {
      const prices = matchStandPrices.filter(
        (msp) => msp.id_match === match.id
      );

      return {
        ...match.get({ plain: true }),
        stand_prices: prices,
      };
    });

    return res.json({ matches });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMatchById = async (req, res) => {
  try {
    const match = await Match.findByPk(req.params.id, {
      include: [{ association: "local" }, { association: "visitor" }],
    });

    const matchStandPrices = await MatchStandPrice.findAll({
      where: { id_match: req.params.id },
      include: [{ association: "stand" }],
    });

    if (!match) return res.status(404).json({ message: "Match not found" });
    return res.json({
      match: { ...match.get({ plain: true }), stand_prices: matchStandPrices },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateMatch = async (req, res) => {
  try {
    const matchUpdate = await Match.findByPk(req.params.id);
    if (!matchUpdate)
      return res.status(404).json({ message: "Match not found" });

    const {
      id_team_local,
      id_team_visitor,
      match_date,
      match_hour,
      state,
      stadium,
    } = req.body;
    if (
      id_team_local !== undefined &&
      id_team_visitor !== undefined &&
      id_team_local === id_team_visitor
    )
      return res
        .status(400)
        .json({ message: "Local and visitor teams must be different" });
    if (state && !VALID_STATES.includes(state))
      return res.status(400).json({ message: "Invalid state" });

    // Si se cambian los equipos, asegurar que existen
    if (id_team_local) {
      const local = await Team.findByPk(id_team_local);
      if (!local)
        return res.status(400).json({ message: "Local team not found" });
    }
    if (id_team_visitor) {
      const visitor = await Team.findByPk(id_team_visitor);
      if (!visitor)
        return res.status(400).json({ message: "Visitor team not found" });
    }

    const updatable = {};
    if (id_team_local !== undefined) updatable.id_team_local = id_team_local;
    if (id_team_visitor !== undefined)
      updatable.id_team_visitor = id_team_visitor;
    if (match_date !== undefined) updatable.match_date = match_date;
    if (match_hour !== undefined) updatable.match_hour = match_hour;
    if (stadium !== undefined) updatable.stadium = stadium;
    if (state !== undefined) updatable.state = state;

    await matchUpdate.update(updatable);

    const match = await Match.findByPk(matchUpdate.id, {
      include: [{ association: "local" }, { association: "visitor" }],
    });
    return res.json({ match });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteMatch = async (req, res) => {
  try {
    const match = await Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found" });
    await match.destroy();
    return res.json({ message: "Match deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export default {
  createMatch,
  getMatches,
  getMatchById,
  updateMatch,
  deleteMatch,
};
