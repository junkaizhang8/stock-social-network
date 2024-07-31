CREATE TYPE VISIBILITY AS ENUM ('public', 'private', 'shared');
CREATE TYPE RELATION AS ENUM ('friend', 'request', 'rejected');
CREATE DOMAIN PRICE AS NUMERIC(12, 2);
CREATE TABLE account (
  account_id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);
CREATE TABLE relationship (
  friend1 SERIAL NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
  friend2 SERIAL NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
  type RELATION NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (friend1, friend2)
);
CREATE TABLE portfolio (
  portfolio_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  owner SERIAL NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
  balance PRICE NOT NULL DEFAULT 0
);
CREATE TABLE stock (
  symbol VARCHAR(5) NOT NULL PRIMARY KEY,
  open PRICE,
  high PRICE,
  low PRICE,
  close PRICE,
  volume INTEGER NOT NULL DEFAULT 0,
  CHECK (open >= 0 AND high >= 0 AND low >= 0 AND close >= 0 AND volume >= 0)
);
CREATE TABLE stock_history (
  symbol VARCHAR(5) NOT NULL,
  open PRICE,
  high PRICE,
  low PRICE,
  close PRICE,
  volume INTEGER,
  date DATE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (symbol, date),
  CHECK (open >= 0 AND high >= 0 AND low >= 0 AND close >= 0 AND volume >= 0)
);
CREATE TABLE in_portfolio (
  portfolio_id SERIAL NOT NULL REFERENCES portfolio(portfolio_id) ON DELETE CASCADE,
  symbol VARCHAR(5) NOT NULL REFERENCES stock(symbol) ON DELETE CASCADE,
  shares INTEGER NOT NULL CHECK (shares >= 1),
  PRIMARY KEY (portfolio_id, symbol)
);
CREATE TABLE transaction (
  transaction_id SERIAL PRIMARY KEY,
  portfolio_id SERIAL NOT NULL REFERENCES portfolio(portfolio_id) ON DELETE CASCADE,
  symbol VARCHAR(5) NOT NULL REFERENCES stock(symbol) ON DELETE CASCADE,
  shares INTEGER NOT NULL CHECK (shares >= 1),
  delta PRICE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE stock_list (
  portfolio_id SERIAL PRIMARY KEY NOT NULL REFERENCES portfolio(portfolio_id) ON DELETE CASCADE,
  visibility VISIBILITY NOT NULL
);
CREATE TABLE review (
  portfolio_id SERIAL NOT NULL REFERENCES portfolio(portfolio_id) ON DELETE CASCADE,
  reviewer SERIAL NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
  text VARCHAR(4000) NOT NULL,
  PRIMARY KEY (portfolio_id, reviewer)
);
CREATE TABLE account_history (
  ah_id SERIAL PRIMARY KEY,
  purchaser SERIAL NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
  symbol VARCHAR(5) NOT NULL REFERENCES stock(symbol) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  delta PRICE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Load past S&P 500 data
COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/SP500History.csv' DELIMITER ',' CSV HEADER;