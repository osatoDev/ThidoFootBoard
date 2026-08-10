import { extractLineupFromScreenshot, LineupExtractionError } from "../_lineupExtraction.js";
import { failRequestLog, finishRequestLog, startRequestLog } from "../_requestLogging.js";

type VercelRequest = {
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
};

type VercelResponse = {
  json: (body: unknown) => void;
  status: (code: number) => VercelResponse;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const requestLog = startRequestLog("/api/lineups/extract", request);
  if (request.method !== "POST") {
    finishRequestLog(requestLog, 405);
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

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
}
