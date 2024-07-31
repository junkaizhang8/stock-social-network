import { Router } from "express";
import { pool } from "../db.js";

export const portfoliosRouter = Router({ mergeParams: true });

// Create a new portfolio
portfoliosRouter.post("/", async (req, res) => {
  const name = req.body.name;
  const balance = parseFloat(req.body.balance) || 0;

  const userId = req.params.userId;

  if (!name) {
    return res.status(422).json({ error: "Name required." });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO portfolio (name, owner, balance)
      VALUES ($1, $2, $3)
      RETURNING portfolio_id;
      `,
      [name, userId, balance]
    );

    return res.json({ portfolioId: result.rows[0].portfolio_id });
  } catch (err) {
    return res.status(422).json({ error: "Could not create portfolio." });
  }
});

// Get portfolios for a user
portfoliosRouter.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;

  if (page < 0 || limit < 0) {
    return res.status(422).json({ error: "Invalid page or limit." });
  }

  const userId = req.params.userId;

  const portfoliosQuery = await pool.query(
    `
    SELECT *
    FROM portfolio
    WHERE owner = $1
    ORDER BY portfolio_id DESC
    OFFSET $2
    LIMIT $3;
    `,
    [userId, page * limit, limit]
  );

  const totalQuery = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM portfolio
    WHERE owner = $1;
    `,
    [userId]
  );

  return res.json({
    portfolios: portfoliosQuery.rows,
    total: totalQuery.rows[0].total,
  });
});
