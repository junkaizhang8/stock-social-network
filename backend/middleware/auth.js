import jwt from "jsonwebtoken";
import { createAccessToken } from "../utils/token.js";

/**
 * Renews access token from refresh token.
 * @param {string} refreshToken - Refresh token.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {object} Payload from verifying token or null if invalid token.
 */
const renewToken = (refreshToken, req, res) => {
  if (!refreshToken) {
    return null;
  }

  try {
    const user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    createAccessToken(user.id, user.username, res);
    req.user = user;
    return user;
  } catch (err) {
    // Invalid refresh token
    return null;
  }
};

export const authenticateToken = (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies;

  // No access token
  if (!accessToken) {
    const user = renewToken(refreshToken, req, res);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated." });
    }
    req.user = user;
    return next();
  }

  // Verify access token
  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    // Access token expired
    if (err) {
      const newUser = renewToken(refreshToken, req, res);
      if (!newUser) {
        return res.status(401).json({ error: "Not authenticated." });
      }
      res.user = newUser;
      return next();
    }
    // User authenticated
    req.user = user;
    next();
  });
};
