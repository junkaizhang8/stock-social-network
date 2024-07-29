import { Router } from "express";
import { pool } from "../db.js";

export const stocksRouter = Router();

// Example router endpoint for getting all the stocks
stocksRouter.get("/", async (req, res) => {
  // Sample query
  const stocks = await pool.query("SELECT * FROM old_stocks LIMIT 10");

  // Sample query with parameters
  // const query = await pool.query(
  //   `
  //   SELECT *
  //   FROM cards
  //   WHERE room_id = $1 AND index = $2;
  //   `,
  //   [room_id, index]
  // );

  res.json({
    stocks: stocks.rows,
    total: stocks.rowCount,
  });
});
