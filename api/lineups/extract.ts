import { extractLineupFromScreenshot, LineupExtractionError } from "../_lineupExtraction.js";

type VercelRequest = {
  body?: unknown;
  method?: string;
};

type VercelResponse = {
  json: (body: unknown) => void;
  status: (code: number) => VercelResponse;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    response.json({ lineup: await extractLineupFromScreenshot(request.body) });
  } catch (error) {
    const statusCode = error instanceof LineupExtractionError ? error.statusCode : 500;
    response.status(statusCode).json({
      error: error instanceof Error ? error.message : "Could not extract this lineup.",
      details: error instanceof LineupExtractionError ? error.details : undefined,
    });
  }
}
