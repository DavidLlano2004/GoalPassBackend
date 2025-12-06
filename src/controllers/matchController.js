import { sequelize } from "../../db.js";
import { Match } from "../models/match.js";
import MatchStandPrice from "../models/matchStandPrice.js";
import SoccerStand from "../models/soccerStand.js";
import { Team } from "../models/team.js";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import MatchSimulation from "../models/matchSimulation.js";
import User from "../models/user.js";
import Ticket from "../models/ticket.js";

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

export const getHistoryMatches = async (req, res) => {
  try {
    const matches = await Match.findAll({
      where: {
        state: {
          [Op.in]: ["finalizado", "cancelado"],
        },
      },
      include: [
        {
          association: "local",
          attributes: ["id", "name", "image_url"],
        },
        {
          association: "visitor",
          attributes: ["id", "name", "image_url"],
        },
      ],
      attributes: {
        include: [
          // Total de tickets vendidos por partido
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM hr.tickets
              WHERE hr.tickets.id_matches = matches.id
            )`),
            "total_tickets_sold",
          ],
          // Total de ganancias por partido
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(price), 0)
              FROM hr.tickets
              WHERE hr.tickets.id_matches = matches.id
            )`),
            "total_revenue",
          ],
        ],
      },
      order: [["match_date", "DESC"]],
    });

    // Obtener todos los IDs de partidos para buscar resultados en una sola consulta
    const matchIds = matches.map((match) => match.id);

    // Buscar todos los resultados de una vez
    const results = await MatchSimulation.findAll({
      where: {
        id_matches: matchIds,
      },
      attributes: ["id_matches", "local_goals", "visitor_goals"],
    });

    // Crear un mapa de resultados por id_matches para acceso rápido
    const resultsMap = results.reduce((map, result) => {
      map[result.id_matches] = {
        local_goals: result.local_goals,
        visitor_goals: result.visitor_goals,
      };
      return map;
    }, {});

    // Formatear partidos
    const matchesFormatted = matches.map((match) => {
      const matchData = match.toJSON();
      const matchResult = resultsMap[match.id] || null;

      return {
        id: matchData.id,
        match_date: matchData.match_date,
        match_hour: matchData.match_hour,
        stadium: matchData.stadium,
        state: matchData.state,
        total_tickets_sold: parseInt(matchData.total_tickets_sold) || 0,
        total_revenue: parseFloat(matchData.total_revenue) || 0,
        local: matchData.local,
        visitor: matchData.visitor,
        result: matchResult
          ? {
              id: matchData.id,
              local_goals: matchResult.local_goals,
              visitor_goals: matchResult.visitor_goals,
            }
          : null,
      };
    });

    // Calcular estadísticas generales
    const summary = matchesFormatted.reduce(
      (acc, match) => {
        return {
          total_matches: acc.total_matches + 1,
          total_tickets_sold: acc.total_tickets_sold + match.total_tickets_sold,
          total_revenue: acc.total_revenue + match.total_revenue,
        };
      },
      {
        total_matches: 0,
        total_tickets_sold: 0,
        total_revenue: 0,
      }
    );

    return res.json({
      success: true,
      summary: {
        total_matches: summary.total_matches,
        total_tickets_sold: summary.total_tickets_sold,
        total_revenue: summary.total_revenue,
        average_tickets_per_match:
          summary.total_matches > 0
            ? Math.round(summary.total_tickets_sold / summary.total_matches)
            : 0,
        average_revenue_per_match:
          summary.total_matches > 0
            ? Math.round(summary.total_revenue / summary.total_matches)
            : 0,
      },
      matches: matchesFormatted,
    });
  } catch (err) {
    console.error("Error fetching history matches:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const formatDateSpanish = (dateString) => {
  if (!dateString) return "Fecha no disponible";
  
  const date = new Date(dateString + 'T00:00:00Z'); // Añadir tiempo para evitar problemas de zona horaria
  if (isNaN(date.getTime())) return "Fecha inválida";
  
  const monthsSpanish = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  const day = date.getUTCDate();
  const month = monthsSpanish[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  
  return `${day} de ${month} del ${year}`;
};

// Función auxiliar para formatear hora en formato 12 horas
const formatTime12h = (timeString) => {
  if (!timeString) return "Hora no disponible";
  
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  
  if (isNaN(hour)) return "Hora inválida";
  
  const ampm = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;
  const minutesFormatted = minutes.padStart(2, '0');
  
  return `${hour12}:${minutesFormatted} ${ampm}`;
};

/**
 * @desc    Obtener estadísticas de compras de boletas del usuario
 * @route   GET /api/users/:userId/purchase-stats
 * @access  Private
 */
export const getUserPurchaseStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // 1. Obtener todos los tickets del usuario
    const tickets = await Ticket.findAll({
      where: { 
        id_users: userId,
        state: "vendido" // Solo tickets vendidos (no anulados)
      },
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
          attributes: ["id", "match_date", "match_hour", "stadium", "state"]
        },
        {
          association: "msp",
          include: [
            {
              association: "stand",
              attributes: ["id", "name", "description"]
            }
          ],
          attributes: ["id", "price"]
        },
        {
          association: "transaction",
          attributes: ["id", "total_amount", "payment_method", "created_at"]
        }
      ],
      order: [["purchased_at", "DESC"]]
    });

    if (tickets.length === 0) {
      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          summary: {
            total_tickets: 0,
            total_matches: 0,
            total_spent: 0,
            favorite_stand: null,
            first_purchase: null,
            last_purchase: null
          },
          matches: [],
          stands_distribution: [],
          message: "El usuario no ha comprado boletas aún"
        }
      });
    }

    // 2. Procesar datos para estadísticas
    const matchesMap = new Map(); // Para contar partidos únicos
    const standsCount = {}; // Para contar frecuencia de gradas
    let totalSpent = 0;
    const purchasesDates = [];

    tickets.forEach(ticket => {
      // Contar partidos únicos
      if (ticket.match) {
        matchesMap.set(ticket.match.id, ticket.match);
      }

      // Contar gradas
      if (ticket.msp && ticket.msp.stand) {
        const standName = ticket.msp.stand.name;
        standsCount[standName] = (standsCount[standName] || 0) + 1;
      }

      // Sumar total gastado
      if (ticket.transaction) {
        totalSpent += parseFloat(ticket.transaction.total_amount);
      }

      // Fechas de compra
      if (ticket.purchased_at) {
        purchasesDates.push(new Date(ticket.purchased_at));
      }
    });

    // 3. Encontrar grada favorita
    let favoriteStand = null;
    let maxCount = 0;
    Object.entries(standsCount).forEach(([standName, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteStand = {
          name: standName,
          count: count,
          percentage: ((count / tickets.length) * 100).toFixed(1) + "%"
        };
      }
    });

    // 4. Preparar respuesta con partidos únicos
    const uniqueMatches = Array.from(matchesMap.values()).map(match => {
      // Filtrar tickets de este partido
      const matchTickets = tickets.filter(t => t.id_matches === match.id);
      
      // Formatear fecha y hora del partido
      const formattedDate = formatDateSpanish(match.match_date);
      const formattedTime = formatTime12h(match.match_hour);
      
      return {
        match_id: match.id,
        local_team: match.local,
        visitor_team: match.visitor,
        date: match.match_date, // Original
        date_formatted: formattedDate, // Formateada
        time: match.match_hour, // Original
        time_formatted: formattedTime, // Formateada
        stadium: match.stadium,
        state: match.state,
        tickets_count: matchTickets.length,
        total_spent_match: matchTickets.reduce((sum, ticket) => 
          sum + parseFloat(ticket.price), 0
        ),
        stands: matchTickets.map(ticket => ({
          stand: ticket.msp?.stand?.name || "Sin especificar",
          price: ticket.price.toLocaleString('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }),
          seat_info: ticket.seat_info,
          purchased_at: ticket.purchased_at ? 
            new Date(ticket.purchased_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : null
        }))
      };
    });

    // 5. Preparar distribución de gradas
    const standsDistribution = Object.entries(standsCount).map(([name, count]) => ({
      stand: name,
      count: count,
      percentage: ((count / tickets.length) * 100).toFixed(1) + "%"
    })).sort((a, b) => b.count - a.count);

    // 6. Calcular fechas de primera y última compra
    purchasesDates.sort((a, b) => a - b);
    const firstPurchase = purchasesDates[0];
    const lastPurchase = purchasesDates[purchasesDates.length - 1];

    // Función para formatear fecha de compra
    const formatPurchaseDate = (date) => {
      if (!date) return null;
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          last_name: user.last_name,
          email: user.email
        },
        summary: {
          total_tickets: tickets.length,
          total_matches: uniqueMatches.length,
          total_spent: totalSpent.toLocaleString('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }),
          average_per_match: (totalSpent / uniqueMatches.length).toLocaleString('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }),
          favorite_stand: favoriteStand,
          first_purchase: firstPurchase ? formatPurchaseDate(firstPurchase) : null,
          last_purchase: lastPurchase ? formatPurchaseDate(lastPurchase) : null,
          months_active: firstPurchase && lastPurchase ? 
            Math.ceil((lastPurchase - firstPurchase) / (1000 * 60 * 60 * 24 * 30)) : 0
        },
        matches: uniqueMatches.sort((a, b) => new Date(b.date) - new Date(a.date)),
        stands_distribution: standsDistribution,
        recent_purchases: tickets.slice(0, 5).map(ticket => ({
          ticket_code: ticket.ticket_code,
          match: `${ticket.match.local.name} vs ${ticket.match.visitor.name}`,
          date_time: `${formatDateSpanish(ticket.match.match_date)} a las ${formatTime12h(ticket.match.match_hour)}`,
          stand: ticket.msp?.stand?.name || "Sin especificar",
          price: ticket.price.toLocaleString('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }),
          purchased_at: ticket.purchased_at ? 
            new Date(ticket.purchased_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : null
        }))
      }
    });

  } catch (error) {
    console.error("Error getting user purchase stats:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de compras",
      error: error.message
    });
  }
};

// Versión para el propio usuario autenticado
export const getMyPurchaseStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Crear un objeto req.params simulado para reutilizar la función
    const mockReq = { params: { userId } };
    const mockRes = {
      json: (data) => res.json(data),
      status: (code) => ({
        json: (data) => res.status(code).json(data)
      })
    };

    await getUserPurchaseStats(mockReq, mockRes);
    
  } catch (error) {
    console.error("Error getting my purchase stats:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de compras",
      error: error.message
    });
  }
};

export default {
  createMatch,
  getMatches,
  getMatchById,
  updateMatch,
  deleteMatch,
  getHistoryMatches,
  getUserPurchaseStats,
  getMyPurchaseStats
};
