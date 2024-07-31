import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { authenticateToken } from "./middleware/auth.js";
import { usersRouter } from "./routers/users_router.js";
import { portfoliosRouter } from "./routers/portfolios_router.js";
import { stocksRouter } from "./routers/stocks_router.js";
import { statsRouter } from "./routers/stats_router.js";

const PORT = 4000;
export const app = express();
app.use(bodyParser.json());

app.use(cookieParser());

app.use(express.static("static"));

// Routers should always be plural
app.use("/api/users", usersRouter);
app.use("/api/portfolios", authenticateToken, portfoliosRouter);
app.use("/api/stocks", stocksRouter);

// TODO: fix
app.use("/api/stats", statsRouter);

// Debugging endpoint to check if we can connect to the server
app.get("/", (req, res) => {
  console.log ("Hello :(");
  res.send("Hello world!");
});

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
