import { Router } from "express";
import { pool } from "../db.js";

export const requestsRouter = Router();

// Send a friend request
requestsRouter.post("/", async (req, res) => {
  const friendId = parseInt(req.query.uid);

  const userId = req.user.id;

  if (!friendId) {
    return res.status(422).json({ error: "User ID required." });
  }

  if (friendId === userId) {
    return res.status(422).json({ error: "Cannot send request to self." });
  }

  const user1 = Math.min(userId, friendId);
  const user2 = Math.max(userId, friendId);
  const reqFrom = userId === user1 ? "u1request" : "u2request";

  try {
    const relTypeQuery = await pool.query(
      `
      SELECT type, NOW() - timestamp > INTERVAL '5 minutes' AS can_resend
      FROM relationship
      WHERE user1 = $1 AND user2 = $2;
      `,
      [user1, user2]
    );

    // Existing relationship
    if (relTypeQuery.rowCount > 0) {
      // Friend request already exists
      if (
        relTypeQuery.rows[0].type === "u1request" ||
        relTypeQuery.rows[0].type === "u2request"
      ) {
        return res
          .status(422)
          .json({ error: "Friend request already exists." });
      }

      // 5 minutes passed since last rejected request
      if (
        relTypeQuery.rows[0].type === "rejected" &&
        relTypeQuery.rows[0].can_resend
      ) {
        await pool.query(
          `
          UPDATE relationship
          SET type = $3, timestamp = NOW()
          WHERE user1 = $1 AND user2 = $2;
          `,
          [user1, user2, reqFrom]
        );
        return res.json({ message: "Friend request sent." });
      }

      return res.status(422).json({ error: "Cannot send friend request." });
    }

    // No existing relationship
    await pool.query(
      `
      INSERT INTO relationship (user1, user2, type)
      VALUES ($1, $2, $3);
      `,
      [user1, user2, reqFrom]
    );

    return res.json({ message: "Friend request sent." });
  } catch (err) {
    return res.status(422).json({ error: "Could not send friend request." });
  }
});

// Get friend requests
requestsRouter.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;

  if (page < 0 || limit < 0) {
    return res.status(422).json({ error: "Invalid page or limit." });
  }

  const userId = req.user.id;

  const requestQuery = await pool.query(
    `
    SELECT user_id
    FROM (
      SELECT user2 AS user_id, timestamp
      FROM relationship
      WHERE (user1 = $1 AND type = 'u2request')
      UNION 
      SELECT user1 AS user_id, timestamp
      FROM relationship
      WHERE (user2 = $1 AND type = 'u1request')
      ORDER BY timestamp DESC
      OFFSET $2
      LIMIT $3);
    `,
    [userId, page * limit, limit]
  );

  const totalQuery = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM relationship
    WHERE (user1 = $1 AND type = 'u2request')
      OR (user2 = $1 AND type = 'u1request');
    `,
    [userId]
  );

  res.json({
    requests: requestQuery.rows,
    total: parseInt(totalQuery.rows[0].total),
  });
});

// Accept/decline a friend request
requestsRouter.patch("/", async (req, res) => {
  const friendId = parseInt(req.query.uid);
  const action = req.query.action;

  const userId = req.user.id;

  if (!friendId) {
    return res.status(422).json({ error: "User ID required." });
  }

  if (friendId === userId) {
    return res.status(422).json({ error: "Cannot handle request from self." });
  }

  const user1 = Math.min(userId, friendId);
  const user2 = Math.max(userId, friendId);

  if (action !== "accept" && action !== "decline") {
    return res.status(422).json({ error: "Invalid action." });
  }

  const requestQuery = await pool.query(
    `
    SELECT 1
    FROM relationship
    WHERE user1 = $1 AND user2 = $2 AND
      ((user1 = $3 AND type = 'u2request') OR
        (user2 = $3 AND type = 'u1request'));
    `,
    [user1, user2, userId]
  );

  if (requestQuery.rowCount === 0) {
    return res.status(422).json({ error: "Friend request not found." });
  }

  if (action === "accept") {
    await pool.query(
      `
      UPDATE relationship
      SET type = 'friend', timestamp = NOW()
      WHERE user1 = $1 AND user2 = $2 AND
        ((user1 = $3 AND type = 'u2request') OR
          (user2 = $3 AND type = 'u1request'));
      `,
      [user1, user2, userId]
    );

    return res.json({
      message: "Friend request accepted.",
    });
  } else if (action === "decline") {
    await pool.query(
      `
      UPDATE relationship
      SET type = 'rejected', timestamp = NOW()
      WHERE user1 = $1 AND user2 = $2 AND
        ((user1 = $3 AND type = 'u2request') OR
          (user2 = $3 AND type = 'u1request'));
      `,
      [user1, user2, userId]
    );

    return res.json({
      message: "Friend request declined.",
    });
  } else {
    return res.status(422).json({ error: "Invalid action." });
  }
});
