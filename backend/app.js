import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authenticateToken } from "./middleware/auth.js";
import { usersRouter } from "./routers/users_router.js";
import { portfoliosRouter } from "./routers/portfolios_router.js";
import { stocksListsRouter } from "./routers/stock_lists_router.js";
import { stocksRouter } from "./routers/stocks_router.js";
import { requestsRouter } from "./routers/requests_router.js";
import { friendsRouter } from "./routers/friends_router.js";
import { statsRouter } from "./routers/stats_router.js";

const PORT = 4000;
export const app = express();
app.use(bodyParser.json());

app.use(cookieParser());

app.use(express.static("static"));

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

app.use(cors(corsOptions));

app.use("/api/users", usersRouter);
app.use("/api/portfolios", authenticateToken, portfoliosRouter);
app.use("/api/stock-lists", authenticateToken, stocksListsRouter);
app.use("/api/stocks", authenticateToken, stocksRouter);
app.use("/api/requests", authenticateToken, requestsRouter);
app.use("/api/friends", authenticateToken, friendsRouter);

// TODO: fix
app.use("/api/stats", statsRouter);

// Debugging endpoint to check if we can connect to the server
app.get("/", (req, res) => {
  console.log("Hello :(");
  res.send("Hello world!");
});

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
