import cors from "cors";
import "dotenv/config";
import express, { Request, Response } from "express";

import { extractLineupFromScreenshot, LineupExtractionError } from "../api/_lineupExtraction.js";
import { findMatchLineup } from "../api/_matchLineupSearch.js";
import { FeatureSuggestionError, parseFeatureSuggestion } from "../api/_featureSuggestion.js";
import {
  failRequestLog,
  finishRequestLog,
  logFeatureSuggestion,
  startRequestLog,
} from "../api/_requestLogging.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://127.0.0.1:5174" }));
app.use(express.json({ limit: "14mb" }));

app.get("/api/health", (request: Request, response: Response) => {
  const requestLog = startRequestLog("/api/health", request);
  finishRequestLog(requestLog, 200);
  response.json({
    ok: true,
    screenshotExtraction: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

app.post("/api/lineups/extract", async (request: Request, response: Response) => {
  const requestLog = startRequestLog("/api/lineups/extract", request);
  try {
    const lineup = await extractLineupFromScreenshot(request.body);
    finishRequestLog(requestLog, 200);
    response.json({ lineup });
  } catch (error) {
    const statusCode = error instanceof LineupExtractionError ? error.statusCode : 500;
    failRequestLog(requestLog, statusCode, error);
    response.status(statusCode).json({
      error: error instanceof Error ? error.message : "Could not extract this lineup.",
      details: error instanceof LineupExtractionError ? error.details : undefined,
    });
  }
});

app.post("/api/lineups/find", async (request: Request, response: Response) => {
  const requestLog = startRequestLog("/api/lineups/find", request);
  try {
    const lineup = await findMatchLineup(request.body);
    finishRequestLog(requestLog, 200);
    response.json({ lineup });
  } catch (error) {
    const statusCode = error instanceof LineupExtractionError ? error.statusCode : 500;
    failRequestLog(requestLog, statusCode, error);
    response.status(statusCode).json({
      error: error instanceof Error ? error.message : "Could not find this match lineup.",
      details: error instanceof LineupExtractionError ? error.details : undefined,
    });
  }
});

app.post("/api/feature-suggestions", (request: Request, response: Response) => {
  const requestLog = startRequestLog("/api/feature-suggestions", request);
  try {
    const { category, suggestion } = parseFeatureSuggestion(request.body);
    logFeatureSuggestion(requestLog, category, suggestion);
    finishRequestLog(requestLog, 201, { category });
    response.status(201).json({ ok: true });
  } catch (error) {
    const statusCode = error instanceof FeatureSuggestionError ? 400 : 500;
    failRequestLog(requestLog, statusCode, error);
    response.status(statusCode).json({
      error:
        error instanceof FeatureSuggestionError
          ? error.message
          : "Could not send your suggestion.",
    });
  }
});

app.listen(port, () => {
  console.log(`Thido lineup backend listening on http://127.0.0.1:${port}`);
});
