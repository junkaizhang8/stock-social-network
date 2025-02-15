CREATE TYPE VISIBILITY AS ENUM ('public', 'private', 'shared');
CREATE TYPE RELATION AS ENUM ('friend', 'u1request', 'u2request', 'rejected');
CREATE DOMAIN PRICE AS NUMERIC(12, 2);
CREATE TABLE account (
  account_id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);
CREATE TABLE relationship (
  user1 SERIAL REFERENCES account(account_id) ON DELETE CASCADE,
  user2 SERIAL REFERENCES account(account_id) ON DELETE CASCADE,
  type RELATION NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user1, user2),
  CHECK (user1 < user2)
);
CREATE TABLE stock_collection (
  collection_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  owner SERIAL NOT NULL REFERENCES account(account_id) ON DELETE CASCADE
);
CREATE TABLE portfolio (
  collection_id SERIAL PRIMARY KEY REFERENCES stock_collection(collection_id) ON DELETE CASCADE,
  balance PRICE NOT NULL DEFAULT 0 CHECK (balance >= 0)
);
CREATE TABLE stock_list (
  collection_id SERIAL PRIMARY KEY REFERENCES stock_collection(collection_id) ON DELETE CASCADE,
  visibility VISIBILITY NOT NULL
);
CREATE TABLE stat2_cache (
  stock1 VARCHAR(5) NOT NULL,
  stock2 VARCHAR(5) NOT NULL,
  last_updated DATE DEFAULT NULL,
  covariance REAL DEFAULT 0,
  correlation REAL DEFAULT 0,
  PRIMARY KEY (stock1, stock2)
);
CREATE TABLE stock (
  symbol VARCHAR(5) NOT NULL PRIMARY KEY,
  last_updated DATE DEFAULT NULL,
  beta REAL DEFAULT 0,
  variance REAL DEFAULT 0,
  coef REAL DEFAULT 0
);
CREATE TABLE stock_history (
  symbol VARCHAR(5),
  open PRICE,
  high PRICE,
  low PRICE,
  close PRICE,
  volume BIGINT,
  date DATE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (symbol, date),
  CHECK (open >= 0 AND high >= 0 AND low >= 0 AND close >= 0 AND volume >= 0)
);
CREATE TABLE in_collection (
  collection_id SERIAL REFERENCES stock_collection(collection_id) ON DELETE CASCADE,
  symbol VARCHAR(5) REFERENCES stock(symbol) ON DELETE CASCADE,
  shares INTEGER NOT NULL CHECK (shares >= 1),
  PRIMARY KEY (collection_id, symbol)
);
CREATE TABLE transaction (
  transaction_id SERIAL PRIMARY KEY,
  collection_id SERIAL NOT NULL REFERENCES stock_collection(collection_id) ON DELETE CASCADE,
  symbol VARCHAR(5) NOT NULL REFERENCES stock(symbol) ON DELETE CASCADE,
  shares INTEGER NOT NULL CHECK (shares != 0),
  delta PRICE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE review (
  collection_id SERIAL REFERENCES stock_collection(collection_id) ON DELETE CASCADE,
  reviewer SERIAL REFERENCES account(account_id) ON DELETE CASCADE,
  text VARCHAR(4000) NOT NULL,
  PRIMARY KEY (collection_id, reviewer)
);
-- Load past S&P 500 data
COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/SP500History.csv' DELIMITER ',' CSV HEADER;

INSERT INTO stock(symbol)
SELECT symbol FROM stock_history GROUP BY symbol;

-- Load new stock data
COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/AAL.csv' DELIMITER ',' CSV HEADER;

COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/AAP.csv' DELIMITER ',' CSV HEADER;

COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/ABBV.csv' DELIMITER ',' CSV HEADER;

COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/ABT.csv' DELIMITER ',' CSV HEADER;

COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/ACN.csv' DELIMITER ',' CSV HEADER;

COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/ADBE.csv' DELIMITER ',' CSV HEADER;

COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/ADI.csv' DELIMITER ',' CSV HEADER;

COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/ADM.csv' DELIMITER ',' CSV HEADER;

COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/ADP.csv' DELIMITER ',' CSV HEADER;

COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/ADSK.csv' DELIMITER ',' CSV HEADER;

COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/AEE.csv' DELIMITER ',' CSV HEADER;

COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/INTC.csv' DELIMITER ',' CSV HEADER;

COPY stock_history(date, open, high, low, close, volume, symbol)
FROM '/docker-entrypoint-initdb.d/ZTS.csv' DELIMITER ',' CSV HEADER;
