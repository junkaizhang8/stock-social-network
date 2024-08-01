import { Router } from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

export const statsRouter = Router();

async function get_stat1_cache (sym) {
  /* get cache for when stock was last updated */ 
  const cache = await pool.query(
    `
    SELECT *
    FROM stock
    WHERE symbol=$1
    `,
    [sym]);

  /* get date for when stock was last updated */
  const sym_date = await pool.query(
    `
    SELECT MAX(date) AS date
    FROM stock_history
    WHERE symbol=$1
    `,
  [sym]);

  let beta; let varr; let coef;

  /* if cache is out of date, recalculate values */
  if ((cache.rowCount == 0)
  || (cache.rows[0].last_updated.toString() !== sym_date.rows[0].date.toString())) {
    beta = await get_beta(sym); 
    varr = await get_var(sym);
    coef = await get_coef_var(sym);
    console.log("recalculating...");

  } else {
    /* fetch from cache */
    beta = cache.rows[0].beta;
    varr = cache.rows[0].variance;
    coef = cache.rows[0].coef;
    console.log("using cache");
  }

  /* cache does not exist, add it to stock */ 
  if (cache.rowCount == 0) {
    await pool.query(
      `
      INSERT INTO stock(symbol, last_updated, beta, variance, coef)
      VALUES ($1, $2, $3, $4, $5)
      `,
    [sym, sym_date.rows[0].date, beta, varr, coef]);
    console.log("inserting into cache");

  /* update entry in cache */
  } else if (cache.rows[0].last_updated.toString() != sym_date.rows[0].date.toString()) {
    await pool.query(
      `
      UPDATE stock
      SET last_updated=$2, beta=$3, variance=$4, coef=$5
      WHERE symbol=$1
      `,
    [sym, sym_date.rows[0].date, beta, varr, coef]);
    console.log("updating cache entry");
  }

  return {
    beta: beta,
    varr: varr,
    coef: coef,
  };
}


async function get_stat2_cache(sym1, sym2) {
  const cache = await pool.query(
    `
    SELECT *
    FROM stat2_cache
    WHERE (stock1=$1 AND stock2=$2) OR (stock1=$2 AND stock2=$1)
    `,
  [sym1, sym2]);

  const sym_date = await pool.query(
    `
    SELECT MAX(date) AS date
    FROM ((SELECT date
           FROM stock_history
           WHERE symbol=$1)
         INTERSECT
          (SELECT date
           FROM stock_history
           WHERE symbol=$2));
    `,
  [sym1, sym2]);

  let cov; let corr;

  /* if cache is out of date, recalculate values */
  if ((cache.rowCount == 0)
  || (cache.rows[0].last_updated.toString() !== sym_date.rows[0].date.toString())) {
    cov = await get_cov(sym1, sym2);
    corr = await get_corr(sym1, sym2);
    console.log("recalculating...");

  } else {
    /* fetch from cache */
    cov = cache.rows[0].covariance;
    corr = cache.rows[0].correlation;
    console.log("using cache");
  }

  /* cache does not exist, add it to stock */ 
  if (cache.rowCount == 0) {
    await pool.query(
      `
      INSERT INTO stat2_cache(stock1, stock2, last_updated, covariance, correlation)
      VALUES ($1, $2, $3, $4, $5)
      `,
    [sym1, sym2, sym_date.rows[0].date, cov, corr]);
    console.log("inserting into cache");

  /* update entry in cache */
  } else if (cache.rows[0].last_updated.toString() != sym_date.rows[0].date.toString()) {
    await pool.query(
      `
      UPDATE stat2_cache
      SET last_updated=$3, covariance=$4, correlation=$5
      WHERE (stock1=$1 AND stock2=$2) OR (stock1=$2 AND stock2=$1)
      `,
    [sym1, sym2, sym_date.rows[0].date, cov, corr]);
    console.log("updating cache entry");
  }

  return {
    corr: corr,
    cov: cov
  };
}


async function get_beta (sym) {
  const data = await pool.query(
    `
    SELECT sp.sum, sym.close
    FROM (SELECT SUM(close), date
          FROM stock_history
          GROUP BY date) sp,

         (SELECT close, date
          FROM stock_history
          WHERE symbol=$1) sym
    WHERE sp.date=sym.date
    `,
    [sym]);

  const delta_percent = (a, b) => {
    return (b - a) / a
  };
  let sp500_avg = 0; let sym_avg = 0;
  for (let i = 0; i < data.rowCount - 1; i++) {
    sp500_avg += delta_percent(data.rows[i].sum, data.rows[i+1].sum);
    sym_avg += delta_percent(data.rows[i].close, data.rows[i+1].close);
  }

  sp500_avg /= data.rowCount - 1;
  sym_avg /= data.rowCount - 1;

  let cov = 0; 
  let varr = 0;
  let t;

  for (let i = 0; i < data.rowCount - 1; i++) {
    t = delta_percent(data.rows[i].sum, data.rows[i+1].sum) - sp500_avg;
    varr += t*t;

    t *= delta_percent(data.rows[i].close, data.rows[i+1].close) - sym_avg;
    cov += t;
  }

  return cov / varr;
}


async function get_var (sym) {
  const stocks = await pool.query(
    `
    SELECT close 
    FROM stock_history 
    WHERE symbol=$1
    `,
    [sym]);

  let avg = 0;
  for (let i = 0; i < stocks.rowCount; i++)
    avg += parseFloat(stocks.rows[i].close);
  avg = avg / stocks.rowCount;


  let a = 0; let t;
  for (let i = 0; i < stocks.rowCount; i++) {
    t = parseFloat(stocks.rows[i].close) - avg;
    a += t*t;
  }

  return a / (stocks.rowCount - 1)
}


async function get_coef_var (sym) {
  const sd = Math.sqrt(await get_var (sym));
  const q = await pool.query(
    `
    SELECT AVG(close)
    FROM stock_history
    WHERE symbol=$1
    `, 
    [sym]);

  return sd / q.rows[0].avg;
}


async function get_cov (sym1, sym2) {
  const stocks = await pool.query(
    `
    SELECT sym1.close AS sym1_close, sym2.close AS sym2_close
    FROM (SELECT close, date
          FROM stock_history
          WHERE symbol=$1) sym1,

         (SELECT close, date
          FROM stock_history
          WHERE symbol=$2) sym2
    WHERE sym1.date=sym2.date
    `,
    [sym1, sym2]);


  let avg1 = 0; let avg2 = 0;
  for (let i = 0; i < stocks.rowCount; i++) {
    avg1 += parseFloat(stocks.rows[i].sym1_close);
    avg2 += parseFloat(stocks.rows[i].sym2_close);
  }

  avg1 = avg1 / stocks.rowCount;
  avg2 = avg2 / stocks.rowCount;

  let a = 0; let t;
  for (let i = 0; i < stocks.rowCount; i++) {
    t = parseFloat(stocks.rows[i].sym1_close) - avg1;
    t *= parseFloat(stocks.rows[i].sym2_close) - avg2;
    a += t;
  }

  return a / (stocks.rowCount - 1);
}


async function get_corr (sym1, sym2) {
  const cov = await get_cov(sym1, sym2);
  const sym1_var = await get_var(sym1);
  const sym2_var = await get_var(sym2);

  return cov / ((Math.sqrt(sym1_var)) * Math.sqrt(sym2_var));
}


statsRouter.get("/stat1", authenticateToken, async (req, res) => {
  const sym = req.query.sym;
  const data = await get_stat1_cache(sym);

  res.json({
    variance: data.varr,
    beta: data.beta,
    cv: data.coef,
    sym: sym,
  });
});

statsRouter.get("/stat2", authenticateToken, async (req, res) => {
  const sym1 = req.query.sym1;
  const sym2 = req.query.sym2;
  const data = await get_stat2_cache(sym1, sym2);

  res.json({
    cov: data.cov,
    corr: data.corr,
    sym1: sym1,
    sym2: sym2,
  });
});
