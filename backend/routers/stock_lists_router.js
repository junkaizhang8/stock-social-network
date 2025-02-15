import { Router } from "express";
import { pool } from "../db.js";
import { reviewsRouter } from "./reviews_router.js";

export const stocksListsRouter = Router();

stocksListsRouter.use("/:listId/reviews", reviewsRouter);

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

// Add/remove shares to a stock list
stocksListsRouter.post("/:id", async (req, res) => {
  const listId = parseInt(req.params.id);
  const symbol = req.body.symbol || "";
  const shares = parseInt(req.body.shares) || 0;

  if (symbol === "" || shares === 0) {
    return res.status(422).json({ error: "Invalid symbol or share quantity." });
  }

  const mode = shares > 0 ? "add" : "remove";

  const userIdQuery = await pool.query(
    `
    SELECT owner
    FROM stock_collection NATURAL JOIN stock_list
    WHERE collection_id = $1;
    `,
    [listId]
  );

  if (userIdQuery.rowCount === 0) {
    return res.status(404).json({ error: "Stock list not found." });
  }

  if (userIdQuery.rows[0].owner !== req.user.id) {
    return res.status(403).json({ error: "Not authorized." });
  }

  const stockExistsQuery = await pool.query(
    `
    SELECT close AS price
    FROM stock_history, (SELECT MAX(date)
                         FROM stock_history
                         WHERE symbol = $1 AND close IS NOT NULL) m
    WHERE symbol = $1 AND m.max = date;
    `,
    [symbol]
  );

  if (stockExistsQuery.rowCount === 0) {
    return res.status(404).json({ error: "Stock not found." });
  }

  const stockInListQuery = await pool.query(
    `
    SELECT shares
    FROM in_collection
    WHERE collection_id = $1 AND symbol = $2;
    `,
    [listId, symbol]
  );

  try {
    // If stock already exists in stock list, update shares
    if (
      stockInListQuery.rowCount > 0 &&
      stockInListQuery.rows[0].shares + shares > 0
    ) {
      await pool.query(
        `
        UPDATE in_collection
        SET shares = shares + $1
        WHERE collection_id = $2 AND symbol = $3;
        `,
        [shares, listId, symbol]
      );

      return res.json({ message: "Stock added." });
    } else if (
      stockInListQuery.rowCount > 0 &&
      stockInListQuery.rows[0].shares + shares == 0
    ) {
      await pool.query(
        `
          DELETE FROM in_collection
          WHERE collection_id = $1 AND symbol = $2
          `,
        [listId, symbol]
      );

      return res.json({ message: "Stock removed." });
    } else if (
      stockInListQuery.rowCount > 0 &&
      stockInListQuery.rows[0].shares + shares < 0
    )
      return res.status(422).json({ error: "Removing more stock than exists" });

    // If stock does not exist in stock list, add stock
    await pool.query(
      `
      INSERT INTO in_collection (collection_id, symbol, shares)
      VALUES ($1, $2, $3);
      `,
      [listId, symbol, shares]
    );

    return res.json({ message: "Stock added." });
  } catch (err) {
    console.log(err);
    return res.status(422).json({ error: "Could not add stock." });
  }
});

// Get public stock lists
stocksListsRouter.get("/", async (req, res) => {
  const userId = req.user.id;

  const stockListQuery = await pool.query(
    `
    SELECT collection_id, name, owner, username AS owner_name, visibility, owner = $1 AS is_owner
    FROM stock_collection NATURAL JOIN (
      SELECT *
      FROM stock_list
      WHERE visibility = 'public'
    )
    JOIN account ON owner = account_id
    ORDER BY collection_id DESC;
    `,
    [userId]
  );

  res.json({
    stockLists: stockListQuery.rows,
    total: stockListQuery.rowCount,
  });
});

// Get shared stock lists
stocksListsRouter.get("/shared", async (req, res) => {
  const userId = req.user.id;

  const stockListQuery = await pool.query(
    `
    SELECT collection_id, name, owner, username AS owner_name, visibility
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
    JOIN account ON owner = account_id
    WHERE visibility = 'shared'
    ORDER BY collection_id DESC;
    `,
    [userId]
  );

  res.json({
    stockLists: stockListQuery.rows,
    total: stockListQuery.rowCount,
  });
});

// Get personal stock lists
stocksListsRouter.get("/me", async (req, res) => {
  const userId = req.user.id;

  const stockListQuery = await pool.query(
    `
    SELECT *
    FROM stock_list NATURAL JOIN (
      SELECT collection_id, name
      FROM stock_collection
      WHERE owner = $1)
    ORDER BY collection_id DESC;
    `,
    [userId]
  );

  return res.json({
    stockLists: stockListQuery.rows,
    total: stockListQuery.rowCount,
  });
});

// Get stocks in a stock list
stocksListsRouter.get("/:id", async (req, res) => {
  const listId = parseInt(req.params.id);

  const userId = req.user.id;

  // Check if user is allowed to see stocks in the list
  // To be allowed, list must exist and either:
  // - list is owned by the user
  // - list is public
  // - user is friends with the owner of the shared list
  const allowedQuery = await pool.query(
    `
    SELECT 1
    FROM stock_list NATURAL JOIN stock_collection
    WHERE collection_id = $1 AND (
      owner = $2 OR visibility = 'public' OR
        visibility = 'shared' AND EXISTS (
          SELECT 1
          FROM relationship
          WHERE ((user1 = $2 AND user2 = owner) OR
            (user1 = owner AND user2 = $2)) AND type = 'friend'
        )
    );
    `,
    [listId, userId]
  );

  if (allowedQuery.rowCount === 0) {
    return res.status(403).json({ error: "Not authorized see this list." });
  }

  const stockQuery = await pool.query(
    `
    SELECT symbol, shares, close AS price
    FROM (
      SELECT *
      FROM in_collection
      WHERE collection_id = $1
    )
    NATURAL JOIN (
      SELECT symbol, MAX(date) AS date
      FROM stock_history
      GROUP BY symbol
    )
    NATURAL JOIN stock_history;
    `,
    [listId]
  );

  res.json({
    stocks: stockQuery.rows,
    total: stockQuery.rowCount,
  });
});

// Delete a stock list
stocksListsRouter.delete("/:id", async (req, res) => {
  const listId = parseInt(req.params.id);

  const userIdQuery = await pool.query(
    `
    SELECT owner
    FROM stock_collection
    WHERE collection_id = $1;
    `,
    [listId]
  );

  if (userIdQuery.rowCount === 0) {
    return res.status(404).json({ error: "Stock list not found." });
  }

  if (userIdQuery.rows[0].owner !== req.user.id) {
    return res.status(403).json({ error: "Not authorized." });
  }

  try {
    await pool.query(
      `
      DELETE FROM stock_collection
      WHERE collection_id = $1;
      `,
      [listId]
    );

    return res.json({ message: "Stock list deleted." });
  } catch (err) {
    return res.status(422).json({ error: "Could not delete stock list." });
  }
});
