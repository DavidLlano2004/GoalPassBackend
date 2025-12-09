import { QueryTypes } from "sequelize";
import { sequelize } from "../../db.js";

export const getReportStatsOptimized = async (req, res) => {
  try {
    // Consulta por partes para mejor debugging
    const queries = {
      // 1. Estadísticas totales
      totalStats: `
        SELECT 
          COALESCE(SUM(price), 0) as total_revenue,
          COUNT(*) as total_tickets_sold
        FROM hr.tickets
        WHERE state = 'vendido'
      `,

      // 2. Capacidad total
      capacityStats: `
        SELECT COALESCE(SUM(total_capacity), 0) as total_capacity
        FROM (
          SELECT DISTINCT msp.id_match, ss.total_capacity
          FROM hr.match_stand_prices msp
          INNER JOIN hr.soccer_stands ss ON msp.id_stand = ss.id
        ) as unique_capacities
      `,

      // 3. Detalles de partidos (FIJATE BIEN EN ESTA)
      matchesDetails: `
        SELECT 
          m.id as match_id,
          CONCAT(tl.name, ' vs ', tv.name) as match_name,
          tl.name as local_team,
          tv.name as visitor_team,
          m.match_date,
          m.stadium,
          m.state,
          
          -- Tickets vendidos
          COALESCE((
            SELECT COUNT(*) 
            FROM hr.tickets t 
            WHERE t.id_matches = m.id AND t.state = 'vendido'
          ), 0) as tickets_sold,
          
          -- Revenue TOTAL (¡ESTA ES LA PARTE IMPORTANTE!)
          COALESCE((
            SELECT SUM(price)
            FROM hr.tickets t 
            WHERE t.id_matches = m.id AND t.state = 'vendido'
          ), 0) as match_revenue,
          
          -- Capacidad
          COALESCE((
            SELECT SUM(ss2.total_capacity)
            FROM hr.match_stand_prices msp2
            INNER JOIN hr.soccer_stands ss2 ON msp2.id_stand = ss2.id
            WHERE msp2.id_match = m.id
          ), 0) as match_capacity,
          
          -- Porcentaje de ocupación
          CASE 
            WHEN (
              SELECT SUM(ss2.total_capacity)
              FROM hr.match_stand_prices msp2
              INNER JOIN hr.soccer_stands ss2 ON msp2.id_stand = ss2.id
              WHERE msp2.id_match = m.id
            ) > 0 
            THEN ROUND((
              (SELECT COUNT(*) FROM hr.tickets t WHERE t.id_matches = m.id AND t.state = 'vendido') * 100.0 / 
              (SELECT SUM(ss2.total_capacity) FROM hr.match_stand_prices msp2 INNER JOIN hr.soccer_stands ss2 ON msp2.id_stand = ss2.id WHERE msp2.id_match = m.id)
            ), 2)
            ELSE 0 
          END as occupancy_percentage
          
        FROM hr.matches m
        LEFT JOIN hr.teams tl ON m.id_team_local = tl.id
        LEFT JOIN hr.teams tv ON m.id_team_visitor = tv.id
        ORDER BY m.match_date DESC
      `,

      // 4. Revenue por grada
      revenueByStand: `
        SELECT 
          ss.name as stand_name,
          COUNT(tk.id) as tickets_sold,
          COALESCE(SUM(tk.price), 0) as stand_revenue
        FROM hr.soccer_stands ss
        LEFT JOIN hr.match_stand_prices msp ON ss.id = msp.id_stand
        LEFT JOIN hr.tickets tk ON msp.id = tk.id_match_stand_price AND tk.state = 'vendido'
        GROUP BY ss.name
        ORDER BY stand_revenue DESC
      `,

      // 5. Revenue por día
      revenueByDay: `
        SELECT 
          DATE(t.created_at) as sale_date,
          COALESCE(SUM(t.total_amount), 0) as daily_revenue,
          COUNT(t.id) as transactions_count
        FROM hr.transactions t
        WHERE t.total_amount > 0
        GROUP BY DATE(t.created_at)
        ORDER BY sale_date DESC
      `,

      // 6. Grada más popular
      mostPopularStand: `
        SELECT ss.name as stand_name
        FROM hr.soccer_stands ss
        LEFT JOIN hr.match_stand_prices msp ON ss.id = msp.id_stand
        LEFT JOIN hr.tickets tk ON msp.id = tk.id_match_stand_price AND tk.state = 'vendido'
        GROUP BY ss.name
        ORDER BY COUNT(tk.id) DESC 
        LIMIT 1
      `,
    };

    // Ejecutar todas las consultas
    const [
      totalStats,
      capacityStats,
      matchesDetails,
      revenueByStand,
      revenueByDay,
      mostPopularStand,
    ] = await Promise.all([
      sequelize.query(queries.totalStats, {
        type: QueryTypes.SELECT,
        plain: true,
      }),
      sequelize.query(queries.capacityStats, {
        type: QueryTypes.SELECT,
        plain: true,
      }),
      sequelize.query(queries.matchesDetails, { type: QueryTypes.SELECT }),
      sequelize.query(queries.revenueByStand, { type: QueryTypes.SELECT }),
      sequelize.query(queries.revenueByDay, { type: QueryTypes.SELECT }),
      sequelize.query(queries.mostPopularStand, {
        type: QueryTypes.SELECT,
        plain: true,
      }),
    ]);

    // Calcular ticketsByStand
    const totalTickets = totalStats.total_tickets_sold || 0;
    const ticketsByStand = revenueByStand.map((stand) => ({
      stand_name: stand.stand_name,
      ticket_count: stand.tickets_sold || 0,
      percentage:
        totalTickets > 0
          ? ((stand.tickets_sold / totalTickets) * 100).toFixed(2)
          : "0.00",
    }));

    // Calcular top 3 partidos
    const topMatches = [...matchesDetails]
      .sort((a, b) => b.tickets_sold - a.tickets_sold)
      .slice(0, 3)
      .map((match) => ({
        match_id: match.match_id,
        match_name: match.match_name,
        tickets_sold: match.tickets_sold,
        match_revenue: match.match_revenue,
        match_capacity: match.match_capacity,
        occupancy_percentage: match.occupancy_percentage,
      }));

    // Calcular porcentaje de ocupación total
    const totalCapacity = capacityStats.total_capacity || 0;
    const totalOccupancyPercentage =
      totalCapacity > 0
        ? parseFloat(
            ((totalStats.total_tickets_sold / totalCapacity) * 100).toFixed(2)
          )
        : 0;

    const response = {
      success: true,
      data: {
        totalStats: {
          totalRevenue: parseFloat(totalStats.total_revenue) || 0,
          totalTicketsSold: parseInt(totalStats.total_tickets_sold) || 0,
          totalCapacity: parseInt(totalCapacity) || 0,
          totalOccupancyPercentage: totalOccupancyPercentage,
          mostPopularStand: mostPopularStand.stand_name || "No disponible",
        },
        revenueByDay: revenueByDay || [],
        revenueByStand: revenueByStand || [],
        ticketsByStand: ticketsByStand || [],
        topMatches: topMatches || [],
        matchesDetails: matchesDetails || [],
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting optimized stats:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: error.message,
    });
  }
};
