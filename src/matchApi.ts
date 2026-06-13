import type { ImportedLineup, MatchSummary } from "./types";

export async function fetchMatchResults(matchDate: string, teamA: string, teamB: string) {
  const params = new URLSearchParams({
    date: matchDate,
    teamA: teamA.trim(),
    teamB: teamB.trim(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin",
  });
  const response = await fetch(`/api/matches/search?${params.toString()}`);
  const body = (await response.json()) as { matches?: MatchSummary[]; error?: string };

  if (!response.ok) {
    throw new Error(body.error ?? "Could not search matches.");
  }

  return body.matches ?? [];
}

export async function fetchMatchLineups(fixtureId: number) {
  const response = await fetch(`/api/matches/${fixtureId}/lineups`);
  const body = (await response.json()) as { lineups?: ImportedLineup[]; error?: string };

  if (!response.ok) {
    throw new Error(body.error ?? "Could not load lineups.");
  }

  return body.lineups ?? [];
}
