import { VercelRequest, VercelResponse } from "./_football.js";

export default function handler(_request: VercelRequest, response: VercelResponse) {
  response.json({
    ok: true,
    provider: "api-football",
    hasApiKey: Boolean(process.env.API_FOOTBALL_KEY),
  });
}
