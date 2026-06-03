import { requiredParam, searchFixtures, sendError, VercelRequest, VercelResponse } from "../_football.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    const date = requiredParam(request.query.date);
    const teamA = requiredParam(request.query.teamA);
    const teamB = requiredParam(request.query.teamB);
    const timezone = requiredParam(request.query.timezone) ?? "Europe/Berlin";

    if (!date || !teamA || !teamB) {
      response.status(400).json({ error: "date, teamA, and teamB are required" });
      return;
    }

    const matches = await searchFixtures(date, teamA, teamB, timezone);
    response.json({ matches });
  } catch (error) {
    sendError(response, error);
  }
}
