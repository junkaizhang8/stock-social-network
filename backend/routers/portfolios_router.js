import { Router } from "express";
import { pool } from "../db.js";

export const portfoliosRouter = Router({ mergeParams: true });

// Create a new portfolio
portfoliosRouter.post("/", async (req, res) => {
  const name = req.body.name;
  const balance = parseFloat(req.body.balance) || 0;

  const userId = req.user.id;

  if (!name) {
    return res.status(422).json({ error: "Name required." });
  }

  try {
    const collectionQuery = await pool.query(
      `
      INSERT INTO stock_collection (name, owner)
      VALUES ($1, $2);
      RETURNING collection_id;
      `,
      [name, userId]
    );

    const collectionId = collectionQuery.rows[0].collection_id;

    await pool.query(
      `
      INSERT INTO portfolio (collection_id, owner, balance)
      VALUES ($1, $2, $3);
      `,
      [collectionId, userId, balance]
    );

    return res.json({ portfolioId: collectionId });
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

  const userId = req.user.id;

  const portfolioQuery = await pool.query(
    `
    SELECT *
    FROM portfolio
    WHERE owner = $1
    ORDER BY collection_id DESC
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
    portfolios: portfolioQuery.rows,
    total: totalQuery.rows[0].total,
  });
});
