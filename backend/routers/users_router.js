import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  createAccessToken,
  createRefreshToken,
  deleteAccessToken,
  deleteRefreshToken,
} from "../utils/token.js";
import { portfoliosRouter } from "./portfolios_router.js";

export const usersRouter = Router();

usersRouter.use("/:userId/portfolios", authenticateToken, portfoliosRouter);

// Sign up
usersRouter.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(422).json({ error: "Username and password required." });
  }

  const existingUser = await pool.query(
    `
    SELECT *
    FROM account
    WHERE username = $1;
    `,
    [username]
  );

  if (existingUser.rows && existingUser.rows.length > 0) {
    return res
      .status(409)
      .json({ error: "Sign up failed. Username already exists." });
  }

  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const passwordHash = bcrypt.hashSync(password, salt);

  try {
    await pool.query(
      `
      INSERT INTO account (username, password)
      VALUES ($1, $2);
      `,
      [username, passwordHash]
    );

    return res.json({ message: "Sign up successful." });
  } catch (err) {
    return res
      .status(422)
      .json({ error: "Sign up failed. Could not create user." });
  }
});

// Log in
usersRouter.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(422).json({ error: "Username and password required." });
  }

  const query = await pool.query(
    `
    SELECT *
    FROM account
    WHERE username = $1;
    `,
    [username]
  );

  if (query.rows && query.rowCount === 0) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  const user = query.rows[0];

  // Incorrect password
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  createAccessToken(user.account_id, user.username, res);
  createRefreshToken(user.account_id, user.username, res);

  return res.json({ message: "Sign in successful." });
});

// Log out
usersRouter.delete("/signout", async (_, res) => {
  deleteAccessToken(res);
  deleteRefreshToken(res);

  return res.json({ message: "Logged out." });
});

// Get current user (debugging endpoint)
usersRouter.get("/me", authenticateToken, (req, res) => {
  return res.json({ username: req.user.username });
});
