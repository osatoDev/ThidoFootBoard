import {
  FeatureSuggestionError,
  parseFeatureSuggestion,
} from "./_featureSuggestion.js";
import {
  failRequestLog,
  finishRequestLog,
  logFeatureSuggestion,
  startRequestLog,
} from "./_requestLogging.js";

type VercelRequest = {
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
};

type VercelResponse = {
  json: (body: unknown) => void;
  status: (code: number) => VercelResponse;
};

export default function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const requestLog = startRequestLog("/api/feature-suggestions", request);
  if (request.method !== "POST") {
    finishRequestLog(requestLog, 405);
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const { category, suggestion } = parseFeatureSuggestion(request.body);
    logFeatureSuggestion(requestLog, category, suggestion);
    finishRequestLog(requestLog, 201, { category });
    response.status(201).json({ ok: true });
  } catch (error) {
    const status = error instanceof FeatureSuggestionError ? 400 : 500;
    failRequestLog(requestLog, status, error);
    response.status(status).json({
      error:
        error instanceof FeatureSuggestionError
          ? error.message
          : "Could not send your suggestion.",
    });
  }
}
