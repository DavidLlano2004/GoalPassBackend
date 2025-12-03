import { Transaction } from "../models/transaction.js";
import { User } from "../models/user.js";
import { Match } from "../models/match.js";
import { v4 as uuidv4 } from "uuid";
import MatchStandPrice from "../models/matchStandPrice.js";
import Ticket from "../models/ticket.js";
import SoccerStand from "../models/soccerStand.js";
import Team from "../models/team.js";

// sanitize helper
const sanitize = (t) => {
  if (!t) return null;
  const obj = { ...t.dataValues };
  return obj;
};

// Create transaction (user creates for self)
export const createTransaction = async (req, res) => {
  try {
    const {
      id_matches,
      total_amount,
      number_tickets,
      payment_method,
      reference,
      currency,
    } = req.body;
    const id_users = req.user.id;

    if (total_amount === undefined)
      return res.status(400).json({ message: "total_amount is required" });

    if (id_matches) {
      const match = await Match.findByPk(id_matches);
      if (!match) return res.status(400).json({ message: "Match not found" });
    }

    const tx = await Transaction.create({
      id: uuidv4(),
      id_users,
      id_matches: id_matches || null,
      total_amount,
      number_tickets: number_tickets || 1,
      payment_method: payment_method || null,
      reference: reference || null,
      currency: currency || "COP",
    });
    return res.status(201).json({ transaction: sanitize(tx) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get my transactions (user)
export const getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { id_users: req.user.id },
      include: [{ association: "match" }],
    });
    return res.json({ transactions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin: list all
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [{ association: "user" }, { association: "match" }],
    });
    return res.json({ transactions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get by id (admin or owner)
export const getTransactionById = async (req, res) => {
  try {
    const tx = await Transaction.findByPk(req.params.id, {
      include: [{ association: "user" }, { association: "match" }],
    });
    if (!tx) return res.status(404).json({ message: "Transaction not found" });
    if (req.user.rol !== "administrador" && tx.id_users !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });
    return res.json({ transaction: sanitize(tx) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin: update
export const updateTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findByPk(req.params.id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    const {
      id_users,
      id_matches,
      total_amount,
      number_tickets,
      payment_method,
      reference,
      currency,
    } = req.body;
    const updatable = {};
    if (id_users !== undefined) updatable.id_users = id_users;
    if (id_matches !== undefined) updatable.id_matches = id_matches;
    if (total_amount !== undefined) updatable.total_amount = total_amount;
    if (number_tickets !== undefined) updatable.number_tickets = number_tickets;
    if (payment_method !== undefined) updatable.payment_method = payment_method;
    if (reference !== undefined) updatable.reference = reference;
    if (currency !== undefined) updatable.currency = currency;

    await tx.update(updatable);
    return res.json({ transaction: sanitize(tx) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin: delete
export const deleteTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findByPk(req.params.id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });
    await tx.destroy();
    return res.json({ message: "Transaction deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getTransactionDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: { id },
      include: [
        {
          model: Match,
          as: "match",
          include: [
            {
              model: Team,
              as: "local",
              attributes: ["id", "name", "image_url"],
            },
            {
              model: Team,
              as: "visitor",
              attributes: ["id", "name", "image_url"],
            },
          ],
          attributes: [
            "id",
            "id_team_local",
            "id_team_visitor",
            "match_date",
            "match_hour",
            "stadium",
          ],
        },
      ],
      attributes: ["id", "total_amount", "number_tickets"],
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transacción no encontrada" });
    }

    const ticket = await Ticket.findAll({
      where: { id_transaction: transaction?.id },
      attributes: ["id", "id_match_stand_price", "price", "ticket_code"],
      include: [
        {
          model: MatchStandPrice,
          as: "msp",
          attributes: ["id", "price", "id_stand"],
          include: [
            {
              model: SoccerStand,
              as: "stand",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    const endData = {
      ...transaction.dataValues,
      ticket,
    };

    return res.status(200).json({
      message: "Tickets de la transacción obtenidos exitosamente",
      response: endData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener los tickets de la transacción",
      error: error.message,
    });
  }
};

export default {
  createTransaction,
  getMyTransactions,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionDetails,
};
