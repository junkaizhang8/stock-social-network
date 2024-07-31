import pg from "pg";

export const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5430,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "a",
  database: process.env.DB_NAME || "c43pgdb",
});
