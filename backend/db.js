import pg from "pg";

export const pool = new pg.Pool({
  host: "db",
  port: 5432,
  user: "postgres",
  password: "a",
  database: "c43pgdb",
});
