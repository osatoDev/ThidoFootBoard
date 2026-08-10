import { finishRequestLog, startRequestLog } from "./_requestLogging.js";

type VercelRequest = {
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
};

type VercelResponse = {
  json: (body: unknown) => void;
};

export default function handler(request: VercelRequest, response: VercelResponse) {
  const requestLog = startRequestLog("/api/health", request);
  finishRequestLog(requestLog, 200);
  response.json({
    ok: true,
    screenshotExtraction: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
