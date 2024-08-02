import { Router } from "express";
import { pool } from "../db.js";

export const stocksRouter = Router();

// Validate date format
// Expected format: YYYY-MM-DD
const validateDate = (date) => {
  if (!date) {
    return true;
  }

  const dateRegex = new RegExp(/^\d{4}-\d{2}-\d{2}$/);
  if (!dateRegex.test(date)) {
    return false;
  }

  const [_, month, day] = date.split("-").map((x) => parseInt(x));
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  return true;
};

// Get current stock details
stocksRouter.get("/:symbol", async (req, res) => {
  const symbol = req.params.symbol;

  const stockQuery = await pool.query(
    `
    SELECT *
    FROM stock_history
    WHERE symbol = $1
    ORDER BY date DESC
    LIMIT 1;
    `,
    [symbol]
  );

  if (stockQuery.rowCount === 0) {
    return res.status(404).json({ error: "Stock not found." });
  }

  const { open, high, low, close, volume, date } = stockQuery.rows[0];

  res.json({
    open: parseFloat(open) || null,
    high: parseFloat(high) || null,
    low: parseFloat(low) || null,
    close: parseFloat(close) || null,
    volume: parseInt(volume) || null,
    date: date,
  });
});

// Get stock history
stocksRouter.get("/:symbol/history", async (req, res) => {
  const symbol = req.params.symbol;
  const start = req.query.start;
  const end = req.query.end;

  let interval = "";

  if (!validateDate(start)) {
    return res.status(422).json({ error: "Invalid start date." });
  }

  if (!validateDate(end)) {
    return res.status(422).json({ error: "Invalid end date." });
  }

  if (start) {
    interval += ` AND date >= '${start}'`;
  }

  if (end) {
    interval += ` AND date <= '${end}'`;
  }

  const stockQuery = await pool.query(
    `
    SELECT open, high, low, close, volume, date
    FROM stock_history
    WHERE symbol = $1${interval};
    `,
    [symbol]
  );

  res.json({
    history: stockQuery.rows.map((row) => ({
      open: parseFloat(row.open) || null,
      high: parseFloat(row.high) || null,
      low: parseFloat(row.low) || null,
      close: parseFloat(row.close) || null,
      volume: parseInt(row.volume) || null,
      date: row.date,
    })),
    total: stockQuery.rowCount,
  });
});
