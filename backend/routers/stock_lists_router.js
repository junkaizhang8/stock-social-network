import { Router } from "express";
import { pool } from "../db.js";

export const stocksListsRouter = Router();

// Create a new stock list
stocksListsRouter.post("/", async (req, res) => {
  const name = req.body.name;
  const visibility = req.body.visibility;

  const userId = req.user.id;

  if (!name) {
    return res.status(422).json({ error: "Name required." });
  }

  if (
    visibility !== "public" &&
    visibility !== "private" &&
    visibility !== "shared"
  ) {
    return res.status(422).json({ error: "Invalid visibility." });
  }

  try {
    const collectionQuery = await pool.query(
      `
      INSERT INTO stock_collection (name, owner)
      VALUES ($1, $2)
      RETURNING collection_id;
      `,
      [name, userId]
    );

    const collectionId = collectionQuery.rows[0].collection_id;

    await pool.query(
      `
      INSERT INTO stock_list (collection_id, visibility)
      VALUES ($1, $2);
      `,
      [collectionId, visibility]
    );

    return res.json({ listId: collectionId });
  } catch (err) {
    return res.status(422).json({ error: "Could not create stock list." });
  }
});

// Get public stock lists
stocksListsRouter.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;

  if (page < 0 || limit < 0) {
    return res.status(422).json({ error: "Invalid page or limit." });
  }

  const stockListQuery = await pool.query(
    `
    SELECT *
    FROM stock_collection NATURAL JOIN (
      SELECT *
      FROM stock_list
      WHERE visibility = 'public'
    )
    ORDER BY collection_id DESC
    OFFSET $1
    LIMIT $2;
    `,
    [page * limit, limit]
  );

  const totalQuery = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM stock_collection NATURAL JOIN (
      SELECT collection_id
      FROM stock_list
      WHERE visibility = 'public');
    `
  );

  res.json({
    stockLists: stockListQuery.rows,
    total: parseInt(totalQuery.rows[0].total),
  });
});

// Get shared stock lists
stocksListsRouter.get("/shared", async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;

  const userId = req.user.id;

  if (page < 0 || limit < 0) {
    return res.status(422).json({ error: "Invalid page or limit." });
  }

  const stockListQuery = await pool.query(
    `
    SELECT *
    FROM (
      SELECT user2 AS owner
      FROM relationship
      WHERE (user1 = $1 AND type = 'friend')
      UNION
      SELECT user1 AS owner
      FROM relationship
      WHERE (user2 = $1 AND type = 'friend')
    )
    NATURAL JOIN stock_collection
    NATURAL JOIN stock_list
    WHERE visibility = 'shared'
    ORDER BY collection_id DESC
    OFFSET $2
    LIMIT $3;
    `,
    [userId, page * limit, limit]
  );

  const totalQuery = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM (
      SELECT user2 AS owner
      FROM relationship
      WHERE (user1 = $1 AND type = 'friend')
      UNION
      SELECT user1 AS owner
      FROM relationship
      WHERE (user2 = $1 AND type = 'friend')
    )
    NATURAL JOIN stock_collection
    NATURAL JOIN stock_list
    WHERE visibility = 'shared';
    `,
    [userId]
  );

  res.json({
    stockLists: stockListQuery.rows,
    total: parseInt(totalQuery.rows[0].total),
  });
});

// Get personal stock lists
stocksListsRouter.get("/me", async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;

  const userId = req.user.id;

  if (page < 0 || limit < 0) {
    return res.status(422).json({ error: "Invalid page or limit." });
  }

  const stockListQuery = await pool.query(
    `
    SELECT *
    FROM stock_list NATURAL JOIN (
      SELECT collection_id, name
      FROM stock_collection
      WHERE owner = $1)
    ORDER BY collection_id DESC
    OFFSET $2
    LIMIT $3;
    `,
    [userId, page * limit, limit]
  );

  const totalQuery = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM stock_list NATURAL JOIN (
      SELECT collection_id
      FROM stock_collection
      WHERE owner = $1);
    `,
    [userId]
  );

  return res.json({
    stockLists: stockListQuery.rows,
    total: parseInt(totalQuery.rows[0].total),
  });
});
