import { Ticket } from "../models/ticket.js";
import { User } from "../models/user.js";
import { Match } from "../models/match.js";
import { v4 as uuidv4 } from "uuid";
import MatchStandPrice from "../models/matchStandPrice.js";
import { sequelize } from "../../db.js";
import crypto from "crypto";
import SoccerStand from "../models/soccerStand.js";

// helper to sanitize ticket
const sanitize = (t) => {
  if (!t) return null;
  const obj = { ...t.dataValues };
  return obj;
};

// Generar código único de ticket
const generateTicketCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

// Generar múltiples códigos únicos
const generateUniqueTicketCodes = async (quantity) => {
  const codes = new Set();

  while (codes.size < quantity) {
    codes.add(generateTicketCode());
  }

  // Verificar que no existan en la DB
  const existingCodes = await Ticket.findAll({
    where: {
      ticket_code: Array.from(codes),
    },
    attributes: ["ticket_code"],
  });

  const existingSet = new Set(existingCodes.map((t) => t.ticket_code));

  // Filtrar códigos únicos
  return Array.from(codes).filter((code) => !existingSet.has(code));
};

const generateSeatInfo = () => {
  const row = Math.floor(Math.random() * 30) + 1; // Filas del 1 al 30
  const seat = Math.floor(Math.random() * 50) + 1; // Asientos del 1 al 50

  return {
    row,
    seat,
  };
};

export const createTicket = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      id_users,
      id_matches,
      id_match_stand_price,
      id_transaction,
      price,
      quantity,
    } = req.body;

    // Validaciones básicas
    if (!id_users || !id_matches || price === undefined || !quantity) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "id_users, id_matches, price and quantity are required",
      });
    }

    if (quantity < 1 || quantity > 10) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 10",
      });
    }

    // Validar que el partido exista
    const match = await Match.findByPk(id_matches);
    if (!match) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // Validar que el usuario exista
    const user = await User.findByPk(id_users);
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validar capacidad disponible de la tribuna
    if (id_match_stand_price) {
      const standPrice = await MatchStandPrice.findByPk(id_match_stand_price, {
        include: [{ association: "stand" }],
      });

      if (!standPrice) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Stand price not found",
        });
      }

      // Contar tickets vendidos de esta tribuna para este partido
      const ticketsSold = await Ticket.count({
        where: {
          id_matches,
          id_match_stand_price,
        },
      });

      const available = standPrice.stand.total_capacity - ticketsSold;

      if (quantity > available) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Only ${available} ticket(s) available for this stand`,
          available_tickets: available,
        });
      }
    }

    // Generar códigos únicos
    const ticketCodes = await generateUniqueTicketCodes(quantity);

    if (ticketCodes.length < quantity) {
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        message: "Could not generate unique ticket codes",
      });
    }

    // Preparar datos para crear múltiples tickets
    const ticketsData = ticketCodes.map((code) => {
      const seatInfo = generateSeatInfo();

      return {
        id_users,
        id_matches,
        id_match_stand_price: id_match_stand_price || null,
        id_transaction: id_transaction,
        ticket_code: code,
        price,
        state: "vendido",
        row: seatInfo.row,
        seat: seatInfo.seat,
      };
    });

    // Crear todos los tickets en una sola operación
    const tickets = await Ticket.bulkCreate(ticketsData, { transaction });

    // Confirmar transacción
    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: `${quantity} ticket(s) created successfully`,
      data: {
        tickets: tickets.map((ticket) => ({
          id: ticket.id,
          ticket_code: ticket.ticket_code,
          price: ticket.price,
          state: ticket.state,
          row: ticket.row,
          seat: ticket.seat,
          seat_info: `Fila ${ticket.row} - Asiento ${ticket.seat}`,
          purchased_at: ticket.purchased_at,
        })),
        total_price: parseFloat(price) * quantity,
        quantity: tickets.length,
      },
    });
  } catch (err) {
    // Revertir transacción en caso de error
    await transaction.rollback();
    console.error("Error creating tickets:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// Admin: list all tickets
export const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      include: [
        { association: "user" },
        { association: "match" },
        { association: "msp" },
      ],
    });
    return res.json({ tickets });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      where: { id_users: req.user.id },
      attributes: [
        "id",
        "ticket_code",
        "price",
        "state",
        "row",
        "seat",
        "purchased_at",
      ],
      include: [
        {
          association: "match",
          attributes: ["id", "match_date", "match_hour", "stadium", "state"],
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
        },
        {
          association: "msp",
          attributes: ["id", "price"],
          include: [
            {
              association: "stand",
              attributes: ["id", "name", "total_capacity", "description"],
            },
          ],
        },
      ],
      order: [["purchased_at", "DESC"]], // Ordenar por más recientes
    });

    // Agregar formato legible de asiento
    const ticketsFormatted = tickets.map((ticket) => ({
      ...ticket.toJSON(),
      seat_info:
        ticket.row && ticket.seat
          ? `Fila ${ticket.row} - Asiento ${ticket.seat}`
          : null,
    }));

    return res.json({
      success: true,
      total: ticketsFormatted.length,
      tickets: ticketsFormatted,
    });
  } catch (err) {
    console.error("Error fetching tickets:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// Get ticket by id (admin or owner)
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { association: "user" },
        { association: "match" },
        { association: "msp" },
      ],
    });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    if (req.user.rol !== "administrador" && ticket.id_users !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });
    return res.json({ ticket: sanitize(ticket) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMatchOccupancy = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findByPk(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // Traer precios y gradas en una sola consulta
    const matchStandPrices = await MatchStandPrice.findAll({
      where: { id_match: matchId },
      include: [{ association: "stand" }],
    });

    if (matchStandPrices.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No stands found for this match",
      });
    }

    // *Capacidad total del evento*
    const totalCapacity = matchStandPrices.reduce(
      (sum, msp) => sum + msp.stand.total_capacity,
      0
    );

    // *Boletas vendidas*
    const ticketsSold = await Ticket.count({
      where: { id_matches: matchId },
    });

    const availableTickets = totalCapacity - ticketsSold;

    // *Porcentaje de ocupación*
    const occupancyPercentage = Number(
      ((ticketsSold / totalCapacity) * 100).toFixed(2)
    );

    const availablePercentage = Number(
      ((availableTickets / totalCapacity) * 100).toFixed(2)
    );

    // *Precio más barato del partido*
    const lowestPrice = Math.min(
      ...matchStandPrices.map((msp) => Number(msp.price))
    );

    // *Estado del partido*
    let status = "Disponibles";

    if (availableTickets === 0) {
      status = "Agotadas";
    } else if (availableTickets / totalCapacity <= 0.15) {
      status = "Pocos cupos";
    }

    const responseData = {
      match_id: matchId,
      total_capacity: totalCapacity,
      tickets_sold: ticketsSold,
      available_tickets: availableTickets,
      occupancy_percentage: occupancyPercentage,
      lowest_price: lowestPrice,
      available_percentage: availablePercentage,
      status,
    };

    res.status(200).json({
      message: "Match ticket info retrieved successfully",
      response: responseData,
    });
  } catch (error) {
    console.error("Error getting match occupancy:", error);
    res.status(500).json({
      message: "Error al obtener la ocupación del partido",
      error: error.message,
    });
  }
};

// Admin: update ticket
export const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const updatable = {};
    const {
      id_users,
      id_matches,
      id_match_stand_price,
      ticket_code,
      price,
      state,
    } = req.body;
    if (id_users !== undefined) updatable.id_users = id_users;
    if (id_matches !== undefined) updatable.id_matches = id_matches;
    if (id_match_stand_price !== undefined)
      updatable.id_match_stand_price = id_match_stand_price;
    if (ticket_code !== undefined) updatable.ticket_code = ticket_code;
    if (price !== undefined) updatable.price = price;
    if (state !== undefined) updatable.state = state;

    await ticket.update(updatable);
    return res.json({ ticket: sanitize(ticket) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin: delete ticket
export const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    await ticket.destroy();
    return res.json({ message: "Ticket deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Calcular resumen de tribunas para un partido , optimizado , precios , ventas , capacidad , recaudación

const getAvailabilityStatus = (available, capacity) => {
  if (available === 0) return "Sin disponibilidad";

  const percentage = (available / capacity) * 100;

  if (percentage <= 30) return "Pocas disponibles";

  return "Disponibles";
};

export const getMatchStandsSummary = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findByPk(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    const [stands] = await sequelize.query(
      `
      SELECT
        msp.id_stand,
        ss.name AS stand_name,
        ss.description,
        ss.total_capacity,
        msp.price,

        -- vendidos por tribuna
        COUNT(t.id) FILTER (WHERE t.state = 'vendido') AS tickets_sold,

        -- dinero recaudado
        SUM(
          CASE WHEN t.state = 'vendido' THEN msp.price ELSE 0 END
        ) AS revenue

      FROM hr.match_stand_prices msp
      INNER JOIN hr.soccer_stands ss
        ON ss.id = msp.id_stand

      LEFT JOIN hr.tickets t
        ON t.id_match_stand_price = msp.id
       AND t.id_matches = :matchId

      WHERE msp.id_match = :matchId

      GROUP BY msp.id_stand, ss.name, ss.description, ss.total_capacity, msp.price
      ORDER BY ss.name ASC;
      `,
      {
        replacements: { matchId },
      }
    );

    let totalCapacity = 0;
    let totalSold = 0;
    let totalRevenue = 0;

    const standsFormatted = stands.map((s) => {
      const sold = Number(s.tickets_sold) || 0;
      const capacity = Number(s.total_capacity) || 0;
      const revenue = Number(s.revenue) || 0;

      totalCapacity += capacity;
      totalSold += sold;
      totalRevenue += revenue;

      return {
        stand_id: s.id_stand,
        stand_name: s.stand_name,
        description: s.description,
        total_capacity: capacity,
        price: Number(s.price),
        tickets_sold: sold,
        tickets_available: capacity - sold,
        occupancy_percentage: Number(((sold / capacity) * 100).toFixed(2)),
        revenue,
        availability: getAvailabilityStatus(capacity - sold, capacity),
      };
    });

    const globalOccupancy = ((totalSold / totalCapacity) * 100).toFixed(2);

    return res.json({
      success: true,
      response: {
        match_id: matchId,
        totals: {
          total_capacity: totalCapacity,
          tickets_sold: totalSold,
          available_tickets: totalCapacity - totalSold,
          occupancy_percentage: Number(globalOccupancy),
          total_revenue: totalRevenue,
        },
        stands: standsFormatted,
      },
    });
  } catch (error) {
    console.error("Error optimized:", error);
    res.status(500).json({
      success: false,
      message: "Error getting match stands summary",
      error: error.message,
    });
  }
};

export default {
  createTicket,
  getTickets,
  getMyTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getMatchOccupancy,
  getMatchStandsSummary,
};
