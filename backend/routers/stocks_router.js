import { Router } from "express";
import { pool } from "../db.js";

export const stocksRouter = Router();

// Get current stock prices
stocksRouter.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;

  if (page < 0 || limit < 0) {
    return res.status(422).json({ error: "Invalid page or limit." });
  }

  const stockQuery = await pool.query(
    `
    SELECT *
    FROM stock
    ORDER BY symbol
    OFFSET $1
    LIMIT $2;
    `,
    [page * limit, limit]
  );

  const totalQuery = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM stock;
    `
  );

  res.json({
    stocks: stockQuery.rows,
    total: parseInt(totalQuery.rows[0].total),
  });
});
