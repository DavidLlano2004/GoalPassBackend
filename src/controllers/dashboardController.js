import { QueryTypes } from "sequelize";
import { sequelize } from "../../db.js";

export const getDashboardStatsOptimized = async (req, res) => {
  try {
    const query = `
      WITH 
      daily_monthly_stats AS (
        SELECT 
          COALESCE(COUNT(DISTINCT CASE 
            WHEN DATE(tk.purchased_at) = CURRENT_DATE 
            THEN tk.id 
          END), 0) as daily_tickets_sold,
          COALESCE(SUM(CASE 
            WHEN DATE(tk.purchased_at) = CURRENT_DATE 
            THEN tk.price 
            ELSE 0 
          END), 0) as daily_revenue,
          COALESCE(SUM(CASE 
            WHEN DATE(tk.purchased_at) >= DATE_TRUNC('month', CURRENT_DATE)
            THEN tk.price 
            ELSE 0 
          END), 0) as monthly_revenue
        FROM hr.tickets tk
        WHERE tk.state = 'vendido'
      ),
      
      upcoming_matches AS (
        SELECT 
          m.id as match_id,
          CONCAT(tl.name, ' vs ', tv.name) as match_name,
          -- 🔥 Traducción manual de meses
          CONCAT(
            TO_CHAR(m.match_date, 'DD'),
            ' de ',
            CASE EXTRACT(MONTH FROM m.match_date)
              WHEN 1 THEN 'enero'
              WHEN 2 THEN 'febrero'
              WHEN 3 THEN 'marzo'
              WHEN 4 THEN 'abril'
              WHEN 5 THEN 'mayo'
              WHEN 6 THEN 'junio'
              WHEN 7 THEN 'julio'
              WHEN 8 THEN 'agosto'
              WHEN 9 THEN 'septiembre'
              WHEN 10 THEN 'octubre'
              WHEN 11 THEN 'noviembre'
              WHEN 12 THEN 'diciembre'
            END,
            ' de ',
            TO_CHAR(m.match_date, 'YYYY')
          ) as formatted_date,
          m.match_hour,
          m.stadium,
          -- 🔥 CORRECCIÓN: Suma de capacidad solo de las tribunas asociadas al partido
          (
            SELECT COALESCE(SUM(ss.total_capacity), 0)
            FROM hr.match_stand_prices msp2
            JOIN hr.soccer_stands ss ON msp2.id_stand = ss.id
            WHERE msp2.id_match = m.id
          ) as total_capacity,
          -- 🔥 CORRECCIÓN: Tickets vendidos solo para este partido
          (
            SELECT COALESCE(COUNT(tk2.id), 0)
            FROM hr.tickets tk2
            WHERE tk2.id_matches = m.id
              AND tk2.state = 'vendido'
          ) as tickets_sold,
          -- 🔥 Cálculo corregido del porcentaje de ocupación
          CASE 
            WHEN (
              SELECT COALESCE(SUM(ss2.total_capacity), 0)
              FROM hr.match_stand_prices msp3
              JOIN hr.soccer_stands ss2 ON msp3.id_stand = ss2.id
              WHERE msp3.id_match = m.id
            ) > 0 
            THEN ROUND((
              (
                SELECT COALESCE(COUNT(tk3.id), 0)
                FROM hr.tickets tk3
                WHERE tk3.id_matches = m.id
                  AND tk3.state = 'vendido'
              ) * 100.0 / 
              (
                SELECT COALESCE(SUM(ss3.total_capacity), 0)
                FROM hr.match_stand_prices msp4
                JOIN hr.soccer_stands ss3 ON msp4.id_stand = ss3.id
                WHERE msp4.id_match = m.id
              )
            ), 2)
            ELSE 0 
          END as occupancy_percentage,
          CASE 
            WHEN (
              SELECT COALESCE(SUM(ss4.total_capacity), 0)
              FROM hr.match_stand_prices msp5
              JOIN hr.soccer_stands ss4 ON msp5.id_stand = ss4.id
              WHERE msp5.id_match = m.id
            ) = 0 THEN 'Sin capacidad'
            WHEN ROUND((
              (
                SELECT COALESCE(COUNT(tk4.id), 0)
                FROM hr.tickets tk4
                WHERE tk4.id_matches = m.id
                  AND tk4.state = 'vendido'
              ) * 100.0 / 
              (
                SELECT COALESCE(SUM(ss5.total_capacity), 0)
                FROM hr.match_stand_prices msp6
                JOIN hr.soccer_stands ss5 ON msp6.id_stand = ss5.id
                WHERE msp6.id_match = m.id
              )
            ), 2) >= 70 THEN 'Alto'
            WHEN ROUND((
              (
                SELECT COALESCE(COUNT(tk5.id), 0)
                FROM hr.tickets tk5
                WHERE tk5.id_matches = m.id
                  AND tk5.state = 'vendido'
              ) * 100.0 / 
              (
                SELECT COALESCE(SUM(ss6.total_capacity), 0)
                FROM hr.match_stand_prices msp7
                JOIN hr.soccer_stands ss6 ON msp7.id_stand = ss6.id
                WHERE msp7.id_match = m.id
              )
            ), 2) >= 40 THEN 'Medio'
            ELSE 'Bajo'
          END as occupancy_level
        FROM hr.matches m
        LEFT JOIN hr.teams tl ON m.id_team_local = tl.id
        LEFT JOIN hr.teams tv ON m.id_team_visitor = tv.id
        WHERE m.state NOT IN ('finalizado', 'cancelado')
          AND m.match_date >= CURRENT_DATE
        ORDER BY m.match_date ASC, m.match_hour ASC
        LIMIT 10
      ),
      
      upcoming_count AS (
        SELECT COUNT(*) as upcoming_matches_count
        FROM hr.matches
        WHERE state NOT IN ('finalizado', 'cancelado')
          AND match_date >= CURRENT_DATE
      ),
      
      stand_comparison AS (
        SELECT 
          ss.name as stand_name,
          ss.total_capacity,
          COUNT(tk.id) as tickets_sold,
          CASE 
            WHEN ss.total_capacity > 0 
            THEN ROUND((COUNT(tk.id) * 100.0 / ss.total_capacity), 2)
            ELSE 0 
          END as occupancy_percentage,
          CASE 
            WHEN ss.total_capacity = 0 THEN 'Sin capacidad'
            WHEN (COUNT(tk.id) * 100.0 / ss.total_capacity) >= 80 THEN 'Alto'
            WHEN (COUNT(tk.id) * 100.0 / ss.total_capacity) >= 50 THEN 'Medio'
            ELSE 'Bajo'
          END as occupancy_level
        FROM hr.soccer_stands ss
        LEFT JOIN hr.match_stand_prices msp ON ss.id = msp.id_stand
        LEFT JOIN hr.tickets tk ON msp.id = tk.id_match_stand_price 
          AND tk.state = 'vendido'
          AND tk.id_matches IN (
            SELECT id FROM hr.matches 
            WHERE state NOT IN ('finalizado', 'cancelado')
          )
        GROUP BY ss.id, ss.name, ss.total_capacity
        ORDER BY occupancy_percentage DESC
      ),
      
      -- 🔥 DÍAS EN ESPAÑOL
      sales_trend AS (
        SELECT 
          DATE(tk.purchased_at) as sale_date,
          CASE EXTRACT(DOW FROM tk.purchased_at)
            WHEN 0 THEN 'Dom'
            WHEN 1 THEN 'Lun'
            WHEN 2 THEN 'Mar'
            WHEN 3 THEN 'Mié'
            WHEN 4 THEN 'Jue'
            WHEN 5 THEN 'Vie'
            WHEN 6 THEN 'Sáb'
          END as day_name,
          COALESCE(COUNT(tk.id), 0) as tickets_sold,
          COALESCE(SUM(tk.price), 0) as daily_revenue
        FROM hr.tickets tk
        WHERE tk.purchased_at >= CURRENT_DATE - INTERVAL '7 days'
          AND tk.state = 'vendido'
        GROUP BY DATE(tk.purchased_at), EXTRACT(DOW FROM tk.purchased_at)
        ORDER BY sale_date ASC
      ),
      
      daily_revenue_last_30 AS (
        SELECT 
          DATE(tk.purchased_at) as sale_date,
          COALESCE(SUM(tk.price), 0) as daily_revenue,
          COUNT(DISTINCT tk.id_transaction) as transactions_count
        FROM hr.tickets tk
        WHERE tk.purchased_at >= CURRENT_DATE - INTERVAL '30 days'
          AND tk.state = 'vendido'
        GROUP BY DATE(tk.purchased_at)
        ORDER BY sale_date DESC
      ),
      
      general_summary AS (
        SELECT 
          (SELECT COUNT(*) FROM hr.matches WHERE state NOT IN ('finalizado', 'cancelado')) as active_matches,
          (SELECT COUNT(*) FROM hr.soccer_stands) as total_stands,
          (SELECT COUNT(*) FROM hr.tickets WHERE state = 'vendido') as total_tickets_sold,
          (SELECT COALESCE(SUM(tk.price), 0) 
           FROM hr.tickets tk
           WHERE tk.state = 'vendido') as total_revenue,
          (
            SELECT COALESCE(AVG(daily_sales), 0)
            FROM (
              SELECT COUNT(tk.id) as daily_sales
              FROM hr.tickets tk
              WHERE tk.purchased_at >= CURRENT_DATE - INTERVAL '7 days'
                AND tk.state = 'vendido'
              GROUP BY DATE(tk.purchased_at)
            ) as daily_stats
          ) as avg_daily_sales
      )
      
      SELECT 
        json_build_object(
          'ticketsSold', dms.daily_tickets_sold,
          'revenue', dms.daily_revenue,
          'monthlyRevenue', dms.monthly_revenue
        ) as daily_stats,
        
        json_build_object(
          'count', uc.upcoming_matches_count,
          'matches', (SELECT json_agg(row_to_json(um)) FROM upcoming_matches um)
        ) as upcoming_matches,
        
        (SELECT json_agg(row_to_json(sc)) FROM stand_comparison sc) as stand_comparison,
        
        (SELECT json_agg(row_to_json(st)) FROM sales_trend st) as sales_trend,
        
        (SELECT json_agg(row_to_json(dr)) FROM daily_revenue_last_30 dr) as daily_revenue,
        
        (SELECT row_to_json(gs) FROM general_summary gs) as summary
        
      FROM daily_monthly_stats dms
      CROSS JOIN upcoming_count uc
    `;

    const result = await sequelize.query(query, {
      type: QueryTypes.SELECT,
      plain: true,
    });

    const response = {
      success: true,
      data: {
        dailyStats: result.daily_stats || {},
        upcomingMatches: result.upcoming_matches || { count: 0, matches: [] },
        standComparison: result.stand_comparison || [],
        salesTrend: result.sales_trend || [],
        dailyRevenue: result.daily_revenue || [],
        summary: result.summary || {},
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting optimized dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas del dashboard",
      error: error.message,
    });
  }
};
