import { Router } from "express";
import { pool } from "../db.js";

export const reviewsRouter = Router({ mergeParams: true });

// Create a new review
reviewsRouter.post("/", async (req, res) => {
  const listId = req.params.listId;
  const text = req.body.text;

  const userId = req.user.id;

  if (text === "") {
    return res.status(422).json({ error: "Text required." });
  }

  const reviewExistsQuery = await pool.query(
    `
    SELECT 1
    FROM review
    WHERE collection_id = $1 AND reviewer = $2;
    `,
    [listId, userId]
  );

  if (reviewExistsQuery.rowCount > 0) {
    return res.status(422).json({ error: "Review already exists." });
  }

  // Check if user is allowed to review the list
  // To be allowed, list must exist and not owned by the user and either:
  // - list is public
  // - user is friends with the owner of the shared list
  const allowedQuery = await pool.query(
    `
    SELECT 1
    FROM stock_list NATURAL JOIN stock_collection
    WHERE collection_id = $1 AND owner != $2 AND (
      visibility = 'public' OR
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
    return res.status(422).json({ error: "Cannot review this list." });
  }

  try {
    await pool.query(
      `
      INSERT INTO review (collection_id, reviewer, text)
      VALUES ($1, $2, $3);
      `,
      [listId, userId, text]
    );

    return res.json({ message: "Review created." });
  } catch (err) {
    return res.status(422).json({ error: "Could not create review." });
  }
});

// Get reviews for a list
reviewsRouter.get("/", async (req, res) => {
  const listId = req.params.listId;
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;

  const userId = req.user.id;

  if (page < 0 || limit < 0) {
    return res.status(422).json({ error: "Invalid page or limit." });
  }

  // Check if user is allowed to see reviews of the list
  // To be allowed, list must exist and either:
  // - list is owned by the user
  // - list is public
  // - user is friends with the owner of the shared list
  const allowedQuery = await pool.query(
    `
    SELECT visibility, owner
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
    return res.status(422).json({ error: "Cannot see reviews of this list." });
  }

  const { visibility, owner } = allowedQuery.rows[0];

  const isOwner = userId === owner;

  if (visibility === "shared" && !isOwner) {
    const reviewQuery = await pool.query(
      `
      SELECT collection_id, reviewer, text
      FROM review
      WHERE collection_id = $1 AND reviewer = $2;
      `,
      [listId, userId]
    );

    return res.json({
      reviews: reviewQuery.rows,
      total: reviewQuery.rowCount,
    });
  }

  const reviewQuery = await pool.query(
    `
    SELECT *
    FROM review
    WHERE collection_id = $1
    ORDER BY reviewer DESC
    OFFSET $2
    LIMIT $3;
    `,
    [listId, page * limit, limit]
  );

  const totalQuery = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM review
    WHERE collection_id = $1;
    `,
    [listId]
  );

  res.json({
    reviews: reviewQuery.rows,
    total: parseInt(totalQuery.rows[0].total),
  });
});
