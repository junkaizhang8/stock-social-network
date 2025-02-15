import { Router } from "express";
import { pool } from "../db.js";

export const portfoliosRouter = Router();

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
      VALUES ($1, $2)
      RETURNING collection_id;
      `,
      [name, userId]
    );

    const collectionId = collectionQuery.rows[0].collection_id;

    await pool.query(
      `
      INSERT INTO portfolio (collection_id, balance)
      VALUES ($1, $2);
      `,
      [collectionId, balance]
    );

    return res.json({ portfolioId: collectionId });
  } catch (err) {
    return res.status(422).json({ error: "Could not create portfolio." });
  }
});

// Add/remove shares to a portfolio
portfoliosRouter.post("/:id", async (req, res) => {
  const portfolioId = parseInt(req.params.id);
  const symbol = req.body.symbol || "";
  const shares = parseInt(req.body.shares) || 0;

  if (symbol === "" || shares === 0) {
    return res.status(422).json({ error: "Invalid symbol or share quantity." });
  }

  const mode = shares > 0 ? "add" : "remove";

  const userIdQuery = await pool.query(
    `
    SELECT owner
    FROM stock_collection NATURAL JOIN portfolio
    WHERE collection_id = $1;
    `,
    [portfolioId]
  );

  if (userIdQuery.rowCount === 0) {
    return res.status(404).json({ error: "Portfolio not found." });
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

  const price = parseFloat(stockExistsQuery.rows[0].price);

  // If buying shares, check if user has enough in their balance
  if (mode === "add") {
    const balanceQuery = await pool.query(
      `
      SELECT balance
      FROM portfolio
      WHERE collection_id = $1;
      `,
      [portfolioId]
    );

    const balance = parseFloat(balanceQuery.rows[0].balance);

    if (balance < shares * price) {
      return res.status(404).json({ error: "Insufficient funds." });
    }
  }

  const stockInPortfolioQuery = await pool.query(
    `
    SELECT shares
    FROM in_collection
    WHERE collection_id = $1 AND symbol = $2;
    `,
    [portfolioId, symbol]
  );

  try {
    // If stock already exists in portfolio, update shares
    if (
      stockInPortfolioQuery.rowCount > 0 &&
      stockInPortfolioQuery.rows[0].shares + shares > 0
    ) {
      await pool.query(
        `
        UPDATE in_collection
        SET shares = shares + $1
        WHERE collection_id = $2 AND symbol = $3;
        `,
        [shares, portfolioId, symbol]
      );

      await pool.query(
        `
        UPDATE portfolio
        SET balance = balance - $1
        WHERE collection_id = $2;
        `,
        [shares * price, portfolioId]
      );

      await pool.query(
        `
        INSERT INTO transaction (collection_id, symbol, shares, delta)
        VALUES ($1, $2, $3, $4);
        `,
        [portfolioId, symbol, shares, -1 * shares * price]
      );
      return res.json({ message: "Stock added." });
    } else if (
      stockInPortfolioQuery.rowCount > 0 &&
      stockInPortfolioQuery.rows[0].shares + shares == 0
    ) {
      await pool.query(
        `
          DELETE FROM in_collection
          WHERE collection_id = $1 AND symbol = $2
          `,
        [portfolioId, symbol]
      );

      await pool.query(
        `
          UPDATE portfolio
          SET balance = balance - $1
          WHERE collection_id = $2;
          `,
        [shares * price, portfolioId]
      );

      await pool.query(
        `
          INSERT INTO transaction (collection_id, symbol, shares, delta)
          VALUES ($1, $2, $3, $4);
          `,
        [portfolioId, symbol, shares, -1 * shares * price]
      );
      return res.json({ message: "Stock updated." });
    } else if (
      stockInPortfolioQuery.rowCount > 0 &&
      stockInPortfolioQuery.rows[0].shares + shares < 0
    )
      return res.status(422).json({ error: "Selling more stock than exists." });

    // If stock does not exist in portfolio, add stock
    await pool.query(
      `
      INSERT INTO in_collection (collection_id, symbol, shares)
      VALUES ($1, $2, $3);
      `,
      [portfolioId, symbol, shares]
    );

    await pool.query(
      `
      UPDATE portfolio
      SET balance = balance - $1
      WHERE collection_id = $2;
      `,
      [shares * price, portfolioId]
    );

    await pool.query(
      `
      INSERT INTO transaction (collection_id, symbol, shares, delta)
      VALUES ($1, $2, $3, $4);
      `,
      [portfolioId, symbol, shares, -1 * shares * price]
    );

    return res.json({ message: "Stock added." });
  } catch (err) {
    return res.status(422).json({ error: "Could not add stock." });
  }
});

// Get portfolios for a user
portfoliosRouter.get("/", async (req, res) => {
  const userId = req.user.id;

  const portfolioQuery = await pool.query(
    `
    SELECT *
    FROM portfolio NATURAL JOIN (
      SELECT collection_id, name
      FROM stock_collection
      WHERE owner = $1)
    ORDER BY collection_id DESC;
    `,
    [userId]
  );

  return res.json({
    portfolios: portfolioQuery.rows,
    total: portfolioQuery.rowCount,
  });
});

// Get stocks in a portfolio
portfoliosRouter.get("/:id", async (req, res) => {
  const portfolioId = parseInt(req.params.id);

  const userIdQuery = await pool.query(
    `
    SELECT owner
    FROM stock_collection NATURAL JOIN portfolio
    WHERE collection_id = $1;
    `,
    [portfolioId]
  );

  if (userIdQuery.rowCount === 0) {
    return res.status(404).json({ error: "Portfolio not found." });
  }

  if (userIdQuery.rows[0].owner !== req.user.id) {
    return res.status(403).json({ error: "Not authorized." });
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
    [portfolioId]
  );

  res.json({
    stocks: stockQuery.rows,
    total: stockQuery.rowCount,
  });
});

// Get porfolio balance
portfoliosRouter.get("/:id/balance", async (req, res) => {
  const portfolioId = parseInt(req.params.id);

  const userIdQuery = await pool.query(
    `
    SELECT owner
    FROM stock_collection NATURAL JOIN portfolio
    WHERE collection_id = $1;
    `,
    [portfolioId]
  );

  if (userIdQuery.rowCount === 0) {
    return res.status(404).json({ error: "Portfolio not found." });
  }

  if (userIdQuery.rows[0].owner !== req.user.id) {
    return res.status(403).json({ error: "Not authorized." });
  }

  const balanceQuery = await pool.query(
    `
    SELECT balance
    FROM portfolio
    WHERE collection_id = $1;
    `,
    [portfolioId]
  );

  return res.json({ balance: parseFloat(balanceQuery.rows[0].balance) });
});

// Get portfolio transactions
portfoliosRouter.get("/:id/transactions", async (req, res) => {
  const portfolioId = parseInt(req.params.id);

  const userIdQuery = await pool.query(
    `
    SELECT owner
    FROM stock_collection NATURAL JOIN portfolio
    WHERE collection_id = $1;
    `,
    [portfolioId]
  );

  if (userIdQuery.rowCount === 0) {
    return res.status(404).json({ error: "Portfolio not found." });
  }

  if (userIdQuery.rows[0].owner !== req.user.id) {
    return res.status(403).json({ error: "Not authorized." });
  }

  const transactionQuery = await pool.query(
    `
    SELECT *
    FROM transaction
    WHERE collection_id = $1
    ORDER BY timestamp DESC;
    `,
    [portfolioId]
  );

  res.json({
    transactions: transactionQuery.rows,
    total: transactionQuery.rowCount,
  });
});

// Deposite/withdraw portfolio balance
portfoliosRouter.patch("/:id/balance", async (req, res) => {
  const portfolioId = parseInt(req.params.id);
  const amount = parseFloat(req.body.amount) || 0;

  if (amount == 0) {
    return res.status(422).json({ error: "Invalid amount." });
  }

  const userIdQuery = await pool.query(
    `
    SELECT owner
    FROM stock_collection NATURAL JOIN portfolio
    WHERE collection_id = $1;
    `,
    [portfolioId]
  );

  if (userIdQuery.rowCount === 0) {
    return res.status(404).json({ error: "Portfolio not found." });
  }

  if (userIdQuery.rows[0].owner !== req.user.id) {
    return res.status(403).json({ error: "Not authorized." });
  }

  try {
    const balanceQuery = await pool.query(
      `
      UPDATE portfolio
      SET balance = balance + $1
      WHERE collection_id = $2
      RETURNING balance;
      `,
      [amount, portfolioId]
    );

    return res.json({ balance: parseFloat(balanceQuery.rows[0].balance) });
  } catch (err) {
    return res
      .status(422)
      .json({ error: "Could not update portfolio balance." });
  }
});
