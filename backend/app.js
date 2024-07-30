import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { stocksRouter } from "./routers/stocks_router.js";

const PORT = 4000;
export const app = express();
app.use(bodyParser.json());

app.use(cookieParser());

app.use(express.static("static"));

// Routers should always be plural
app.use("/api/stocks", stocksRouter);

// Debugging endpoint to check if we can connect to the server
app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
