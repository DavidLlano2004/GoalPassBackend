import "../../db.js"; // ensure DB initializes if needed
import User from "./user.js";
import Team from "./team.js";
import Match from "./match.js";
import SoccerStand from "./soccerStand.js";
import Ticket from "./ticket.js";
import MatchStandPrice from "./matchStandPrice.js";
import Transaction from "./transaction.js";
import MatchSimulation from "./matchSimulation.js";
import SimulationEvent from "./simulationEvent.js";

export { User, Team, Match, SoccerStand, Ticket, MatchStandPrice, Transaction, MatchSimulation, SimulationEvent };

export default {
	User,
	Team,
	Match,
	SoccerStand,
	Ticket,
	MatchStandPrice,
	Transaction,
	MatchSimulation,
	SimulationEvent,
};
