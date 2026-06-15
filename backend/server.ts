import cors from "cors";
import "dotenv/config";
import express, { Request, Response } from "express";

import { extractLineupFromScreenshot, LineupExtractionError } from "../api/_lineupExtraction.js";
import { findMatchLineup } from "../api/_matchLineupSearch.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://127.0.0.1:5174" }));
app.use(express.json({ limit: "14mb" }));

app.get("/api/health", (_request: Request, response: Response) => {
  response.json({
    ok: true,
    screenshotExtraction: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

app.post("/api/lineups/extract", async (request: Request, response: Response) => {
  try {
    response.json({ lineup: await extractLineupFromScreenshot(request.body) });
  } catch (error) {
    const statusCode = error instanceof LineupExtractionError ? error.statusCode : 500;
    response.status(statusCode).json({
      error: error instanceof Error ? error.message : "Could not extract this lineup.",
      details: error instanceof LineupExtractionError ? error.details : undefined,
    });
  }
});

app.post("/api/lineups/find", async (request: Request, response: Response) => {
  try {
    response.json({ lineup: await findMatchLineup(request.body) });
  } catch (error) {
    const statusCode = error instanceof LineupExtractionError ? error.statusCode : 500;
    response.status(statusCode).json({
      error: error instanceof Error ? error.message : "Could not find this match lineup.",
      details: error instanceof LineupExtractionError ? error.details : undefined,
    });
  }
});

app.listen(port, () => {
  console.log(`Thido lineup backend listening on http://127.0.0.1:${port}`);
});
