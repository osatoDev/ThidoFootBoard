import { getLineups, requiredParam, sendError, VercelRequest, VercelResponse } from "../../_football.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    const fixtureId = requiredParam(request.query.fixtureId);
    if (!fixtureId) {
      response.status(400).json({ error: "fixtureId is required" });
      return;
    }

    response.json({
      fixtureId: Number(fixtureId),
      lineups: await getLineups(fixtureId),
    });
  } catch (error) {
    sendError(response, error);
  }
}
