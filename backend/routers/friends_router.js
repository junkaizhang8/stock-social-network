import { Router } from "express";
import { pool } from "../db.js";

export const friendsRouter = Router();

// Get friends
friendsRouter.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;

  const userId = req.user.id;

  if (page < 0 || limit < 0) {
    return res.status(422).json({ error: "Invalid page or limit." });
  }

  const friendQuery = await pool.query(
    `
    SELECT user_id
    FROM (
      SELECT user2 AS user_id, timestamp
      FROM relationship
      WHERE (user1 = $1 AND type = 'friend')
      UNION
      SELECT user1 AS user_id, timestamp
      FROM relationship
      WHERE (user2 = $1 AND type = 'friend')
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
    WHERE (user1 = $1 OR user2 = $1) AND type = 'friend';
    `,
    [userId]
  );

  res.json({
    friends: friendQuery.rows,
    total: parseInt(totalQuery.rows[0].total),
  });
});

// Delete a friend
friendsRouter.patch("/", async (req, res) => {
  const friendName = req.query.name;

  const userId = req.user.id;

  if (!friendName) {
    return res.status(422).json({ error: "Username required." });
  }

  const friendIdQuery = await pool.query(
    `
    SELECT account_id
    FROM account
    WHERE username = $1;
    `,
    [friendName]
  );

  if (friendIdQuery.rowCount === 0) {
    return res.status(404).json({ error: "Friend not found." });
  }

  const friendId = friendIdQuery.rows[0].account_id;

  if (friendId === userId) {
    return res.status(422).json({ error: "Cannot delete self." });
  }

  const user1 = Math.min(userId, friendId);
  const user2 = Math.max(userId, friendId);

  const friendQuery = await pool.query(
    `
    SELECT 1
    FROM relationship
    WHERE user1 = $1 AND user2 = $2 AND type = 'friend';
    `,
    [user1, user2]
  );

  if (friendQuery.rowCount === 0) {
    return res.status(404).json({ error: "Friend not found." });
  }

  await pool.query(
    `
    UPDATE relationship
    SET type = 'rejected', timestamp = NOW()
    WHERE user1 = $1 AND user2 = $2 AND type = 'friend';
    `,
    [user1, user2]
  );

  return res.json({ message: "Friend deleted." });
});
