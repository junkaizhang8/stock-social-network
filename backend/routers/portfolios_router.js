import { Router } from "express";

export const portfoliosRouter = Router();

portfoliosRouter.get("/", (req, res) => {
  res.json({ message: "This is the portfolios endpoint." });
});
