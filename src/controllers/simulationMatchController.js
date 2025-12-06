import axios from "axios";
import Match from "../models/match.js";
import MatchSimulation from "../models/matchSimulation.js";
import SimulationEvent from "../models/simulationEvent.js";
import { sequelize } from "../../db.js";
import Ticket from "../models/ticket.js";

// Helper: Generar número aleatorio en un rango
const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper: Generar decimal aleatorio
const randomDecimal = (min, max, decimals = 2) => {
  return (Math.random() * (max - min) + min).toFixed(decimals);
};

// Helper: Obtener jugadores de un equipo desde la API
const getTeamPlayers = async (teamApiId) => {
  try {
    const response = await axios.get(
      `https://www.thesportsdb.com/api/v1/json/123/lookup_all_players.php?id=${teamApiId}`
    );

    if (!response.data.player || response.data.player.length === 0) {
      return [];
    }

    // Retornar solo los nombres de los jugadores
    return response.data.player.map((player) => player.strPlayer);
  } catch (error) {
    console.error(`Error fetching players for team ${teamApiId}:`, error);
    return [];
  }
};

// Helper: Seleccionar jugador aleatorio
const getRandomPlayer = (players) => {
  if (!players || players.length === 0) return "Jugador Desconocido";
  return players[randomInt(0, players.length - 1)];
};

// Helper: Generar eventos del partido
const generateMatchEvents = (
  simulation,
  localPlayers,
  visitorPlayers,
  localTeamId,
  visitorTeamId
) => {
  const events = [];

  // Función para agregar goles
  const addGoals = (teamId, goals, players, teamName) => {
    for (let i = 0; i < goals; i++) {
      events.push({
        id_teams: teamId,
        id_match_simulations: simulation.id,
        minute: randomInt(1, 90),
        type_event: "Gol",
        player: getRandomPlayer(players),
      });
    }
  };

  // Función para agregar tarjetas
  const addCards = (teamId, yellowCards, redCards, players) => {
    // Tarjetas amarillas
    for (let i = 0; i < yellowCards; i++) {
      events.push({
        id_teams: teamId,
        id_match_simulations: simulation.id,
        minute: randomInt(1, 90),
        type_event: "Tarjeta amarilla",
        player: getRandomPlayer(players),
      });
    }

    // Tarjetas rojas
    for (let i = 0; i < redCards; i++) {
      events.push({
        id_teams: teamId,
        id_match_simulations: simulation.id,
        minute: randomInt(1, 90),
        type_event: "Tarjeta roja",
        player: getRandomPlayer(players),
      });
    }
  };

  // Agregar goles
  addGoals(localTeamId, simulation.local_goals, localPlayers, "local");
  addGoals(
    visitorTeamId,
    simulation.visitor_goals,
    visitorPlayers,
    "visitante"
  );

  // Agregar tarjetas
  addCards(
    localTeamId,
    simulation.local_yellow_cards,
    simulation.local_red_cards,
    localPlayers
  );
  addCards(
    visitorTeamId,
    simulation.visitor_yellow_cards,
    simulation.visitor_red_cards,
    visitorPlayers
  );

  // Ordenar eventos por minuto
  return events.sort((a, b) => a.minute - b.minute);
};

export const simulateMatch = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { matchId } = req.params;

    // Verificar que el partido exista
    const match = await Match.findByPk(matchId, {
      include: [
        {
          association: "local",
          attributes: ["id", "id_team_api", "name", "image_url"],
        },
        {
          association: "visitor",
          attributes: ["id", "id_team_api", "name", "image_url"],
        },
      ],
    });

    if (!match) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    if (match.state === "finalizado") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Match is already finished",
      });
    }

    // Verificar si ya existe una simulación para este partido
    const existingSimulation = await MatchSimulation.findOne({
      where: { id_matches: matchId },
    });

    if (existingSimulation) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Simulation already exists for this match",
      });
    }

    // Obtener jugadores de ambos equipos
    const [localPlayers, visitorPlayers] = await Promise.all([
      getTeamPlayers(match.local.id_team_api),
      getTeamPlayers(match.visitor.id_team_api),
    ]);

    // Generar datos aleatorios del partido
    const localGoals = randomInt(0, 4);
    const visitorGoals = randomInt(0, 4);
    
    // Generar goles por tiempo para cada equipo
    const localGoalsFirstHalf = randomInt(0, Math.min(localGoals, 3));
    const localGoalsSecondHalf = localGoals - localGoalsFirstHalf;
    
    const visitorGoalsFirstHalf = randomInt(0, Math.min(visitorGoals, 3));
    const visitorGoalsSecondHalf = visitorGoals - visitorGoalsFirstHalf;
    
    const localPossession = randomDecimal(35, 65);
    const visitorPossession = (100 - parseFloat(localPossession)).toFixed(2);

    const simulationData = {
      id_matches: matchId,
      local_goals: localGoals,
      visitor_goals: visitorGoals,
      local_goals_first_half: localGoalsFirstHalf,
      local_goals_second_half: localGoalsSecondHalf,
      visitor_goals_first_half: visitorGoalsFirstHalf,
      visitor_goals_second_half: visitorGoalsSecondHalf,
      local_possession: localPossession,
      visitor_possession: visitorPossession,
      local_yellow_cards: randomInt(0, 5),
      visitor_yellow_cards: randomInt(0, 5),
      local_red_cards: randomInt(0, 2),
      visitor_red_cards: randomInt(0, 2),
      local_shots_on_goal: randomInt(3, 15),
      visitor_shots_on_goal: randomInt(3, 15),
    };

    // Crear la simulación
    const simulation = await MatchSimulation.create(simulationData, {
      transaction,
    });

    // Generar eventos del partido
    const events = generateMatchEvents(
      simulation,
      localPlayers,
      visitorPlayers,
      match.local.id,
      match.visitor.id,
      {
        localGoalsFirstHalf,
        localGoalsSecondHalf,
        visitorGoalsFirstHalf,
        visitorGoalsSecondHalf
      }
    );

    // Guardar eventos
    await SimulationEvent.bulkCreate(events, { transaction });

    // 1. Actualizar el estado del partido a "finalizado"
    await match.update({ state: "finalizado" }, { transaction });

    // 2. Actualizar TODOS los tickets asociados a este partido a "usado"
    const ticketsUpdated = await Ticket.update(
      { 
        state: "usado",
        updated_at: new Date() // Opcional: agregar fecha de actualización
      },
      {
        where: { 
          id_matches: matchId,
          state: "vendido" // Solo actualizar tickets que están vendidos (no anulados)
        },
        transaction
      }
    );

    // Commit transaction
    await transaction.commit();

    // Obtener la simulación completa con eventos
    const fullSimulation = await MatchSimulation.findByPk(simulation.id, {
      include: [
        {
          association: "match",
          include: [
            { association: "local", attributes: ["id", "name", "image_url"] },
            { association: "visitor", attributes: ["id", "name", "image_url"] },
          ],
        },
      ],
    });

    const simulationEvents = await SimulationEvent.findAll({
      where: { id_match_simulations: simulation.id },
      include: [
        { association: "team", attributes: ["id", "name", "image_url"] },
      ],
      order: [["minute", "ASC"]],
    });

    return res.status(201).json({
      success: true,
      message:
        "Match simulation generated successfully and match marked as finished",
      data: {
        simulation: {
          id: fullSimulation.id,
          local_team: fullSimulation.match.local.name,
          visitor_team: fullSimulation.match.visitor.name,
          score: `${fullSimulation.local_goals} - ${fullSimulation.visitor_goals}`,
          score_by_half: {
            first_half: `${fullSimulation.local_goals_first_half} - ${fullSimulation.visitor_goals_first_half}`,
            second_half: `${fullSimulation.local_goals_second_half} - ${fullSimulation.visitor_goals_second_half}`,
          },
          match_state: "finalizado",
          stats: {
            local: {
              goals: fullSimulation.local_goals,
              goals_by_half: {
                first_half: fullSimulation.local_goals_first_half,
                second_half: fullSimulation.local_goals_second_half
              },
              possession: `${fullSimulation.local_possession}%`,
              shots_on_goal: fullSimulation.local_shots_on_goal,
              yellow_cards: fullSimulation.local_yellow_cards,
              red_cards: fullSimulation.local_red_cards,
            },
            visitor: {
              goals: fullSimulation.visitor_goals,
              goals_by_half: {
                first_half: fullSimulation.visitor_goals_first_half,
                second_half: fullSimulation.visitor_goals_second_half
              },
              possession: `${fullSimulation.visitor_possession}%`,
              shots_on_goal: fullSimulation.visitor_shots_on_goal,
              yellow_cards: fullSimulation.visitor_yellow_cards,
              red_cards: fullSimulation.visitor_red_cards,
            },
          },
        },
        tickets_updated: ticketsUpdated[0], // Número de tickets actualizados
        events: simulationEvents.map((event) => ({
          minute: event.minute,
          type: event.type_event,
          player: event.player,
          team: event.team.name,
          half: event.minute <= 45 ? "first_half" : "second_half"
        })),
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error(" Error simulating match:", error);
    return res.status(500).json({
      success: false,
      message: "Error simulating match",
      error: error.message,
    });
  }
};

export const getMatchSimulation = async (req, res) => {
  try {
    const { matchId } = req.params;

    const simulation = await MatchSimulation.findOne({
      where: { id_matches: matchId },
      include: [
        {
          association: "match",
          include: [
            { 
              association: "local", 
              attributes: ["id", "name", "image_url"] 
            }, 
            { 
              association: "visitor", 
              attributes: ["id", "name", "image_url"] 
            }
          ],
        },
      ],
    });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: "Simulation not found",
      });
    }

    const events = await SimulationEvent.findAll({
      where: { id_match_simulations: simulation.id },
      include: [{ 
        association: "team", 
        attributes: ["id", "name", "image_url"] 
      }],
      order: [["minute", "ASC"]],
    });

    // Formatear la respuesta para incluir estadísticas por tiempo
    const formattedResponse = {
      success: true,
      data: {
        simulation: {
          id: simulation.id,
          match_id: simulation.id_matches,
          score: {
            final: `${simulation.local_goals} - ${simulation.visitor_goals}`,
            by_half: {
              first_half: {
                local: simulation.local_goals_first_half || 0,
                visitor: simulation.visitor_goals_first_half || 0,
                score: `${simulation.local_goals_first_half || 0} - ${simulation.visitor_goals_first_half || 0}`
              },
              second_half: {
                local: simulation.local_goals_second_half || 0,
                visitor: simulation.visitor_goals_second_half || 0,
                score: `${simulation.local_goals_second_half || 0} - ${simulation.visitor_goals_second_half || 0}`
              }
            }
          },
          stats: {
            local: {
              team: simulation.match.local,
              goals: simulation.local_goals,
              goals_by_half: {
                first_half: simulation.local_goals_first_half || 0,
                second_half: simulation.local_goals_second_half || 0
              },
              possession: `${simulation.local_possession}%`,
              shots_on_goal: simulation.local_shots_on_goal,
              yellow_cards: simulation.local_yellow_cards,
              red_cards: simulation.local_red_cards
            },
            visitor: {
              team: simulation.match.visitor,
              goals: simulation.visitor_goals,
              goals_by_half: {
                first_half: simulation.visitor_goals_first_half || 0,
                second_half: simulation.visitor_goals_second_half || 0
              },
              possession: `${simulation.visitor_possession}%`,
              shots_on_goal: simulation.visitor_shots_on_goal,
              yellow_cards: simulation.visitor_yellow_cards,
              red_cards: simulation.visitor_red_cards
            }
          },
          match_info: {
            state: simulation.match.state,
            date: simulation.match.date,
            stadium: simulation.match.stadium
          }
        },
        timeline: {
          events: events.map(event => ({
            id: event.id,
            minute: event.minute,
            half: event.minute <= 45 ? 'first_half' : 'second_half',
            type: event.type_event,
            player: event.player,
            team: {
              id: event.team.id,
              name: event.team.name,
              short_name: event.team.short_name,
              image_url: event.team.image_url
            },
            description: event.description
          })),
          summary: {
            total_events: events.length,
            goals: events.filter(e => e.type_event === 'goal').length,
            yellow_cards: events.filter(e => e.type_event === 'yellow_card').length,
            red_cards: events.filter(e => e.type_event === 'red_card').length,
            substitutions: events.filter(e => e.type_event === 'substitution').length
          }
        }
      }
    };

    return res.json(formattedResponse);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
