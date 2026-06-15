import {
  LineupExtractionError,
  normalizeLineup,
  playerSchema,
  supportedFormations,
} from "./_lineupExtraction.js";

type MatchLineupRequest = {
  approximateDate?: unknown;
  teamA?: unknown;
  teamB?: unknown;
  teamToImport?: unknown;
};

type ClaudeCitation = {
  title?: string;
  type?: string;
  url?: string;
};

type ClaudeContentBlock = {
  citations?: ClaudeCitation[];
  content?: unknown;
  text?: string;
  type?: string;
};

type ClaudeResponse = {
  content?: ClaudeContentBlock[];
  error?: {
    message?: string;
  };
  stop_reason?: string;
};

export type MatchLineupSource = {
  title: string;
  url: string;
};

export type MatchLineupResult = ReturnType<typeof normalizeLineup> & {
  competition: string;
  exactDate: string;
  homeTeam: string;
  awayTeam: string;
  sources: MatchLineupSource[];
};

const matchLineupSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "The selected team whose lineup is being returned.",
    },
    formation: {
      type: "string",
      enum: ["", ...supportedFormations],
      description: "The selected team's formation, or empty when the sources do not establish it.",
    },
    players: {
      type: "array",
      items: playerSchema,
      description: "Confirmed starters for the selected team, ordered goalkeeper to forwards where possible.",
    },
    substitutes: {
      type: "array",
      items: playerSchema,
      description: "Confirmed substitutes or bench players for the selected team.",
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      description: "Missing, conflicting, or uncertain facts in the sourced evidence.",
    },
    exactDate: {
      type: "string",
      description: "Exact fixture date in YYYY-MM-DD format.",
    },
    homeTeam: {
      type: "string",
      description: "Confirmed home team.",
    },
    awayTeam: {
      type: "string",
      description: "Confirmed away team.",
    },
    competition: {
      type: "string",
      description: "Confirmed competition, otherwise empty.",
    },
  },
  required: [
    "name",
    "formation",
    "players",
    "substitutes",
    "warnings",
    "exactDate",
    "homeTeam",
    "awayTeam",
    "competition",
  ],
  additionalProperties: false,
} as const;

function requiredText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new LineupExtractionError(`${label} is required.`, 400);
  }
  return value.trim().slice(0, 100);
}

function parseRequest(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new LineupExtractionError("Match details are required.", 400);
  }

  const request = body as MatchLineupRequest;
  const teamA = requiredText(request.teamA, "Team A");
  const teamB = requiredText(request.teamB, "Team B");
  const approximateDate = requiredText(request.approximateDate, "Approximate date");
  const teamToImport = request.teamToImport === "teamB" ? teamB : teamA;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(approximateDate)) {
    throw new LineupExtractionError("Use a valid approximate date.", 400);
  }

  return {
    approximateDate,
    teamA,
    teamB,
    teamToImport,
  };
}

async function anthropicRequest(body: Record<string, unknown>) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new LineupExtractionError("AI lineup search is not configured.", 503);
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(75_000),
    headers: {
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });
  const responseBody = (await response.json()) as ClaudeResponse;

  if (!response.ok) {
    throw new LineupExtractionError(
      responseBody.error?.message || `Claude request failed with ${response.status}.`,
      response.status >= 400 && response.status < 500 ? 400 : 502,
    );
  }

  if (responseBody.stop_reason === "max_tokens") {
    throw new LineupExtractionError("Claude could not finish the lineup search.", 502);
  }

  return responseBody;
}

function collectSearchEvidence(response: ClaudeResponse) {
  const text = (response.content ?? [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n\n")
    .trim();
  const sources = new Map<string, MatchLineupSource>();

  (response.content ?? []).forEach((block) => {
    (block.citations ?? []).forEach((citation) => {
      if (citation.url) {
        sources.set(citation.url, {
          title: citation.title?.trim() || citation.url,
          url: citation.url,
        });
      }
    });
  });

  const searchFailed = (response.content ?? []).some(
    (block) =>
      block.type === "web_search_tool_result" &&
      block.content &&
      !Array.isArray(block.content) &&
      typeof block.content === "object" &&
      "error_code" in block.content,
  );

  if (searchFailed) {
    throw new LineupExtractionError("Claude web search is temporarily unavailable.", 502);
  }

  if (!text || sources.size === 0) {
    throw new LineupExtractionError("No sourced lineup could be found for that match.", 422);
  }

  return {
    sources: [...sources.values()].slice(0, 8),
    text,
  };
}

function parseStructuredMatch(response: ClaudeResponse, sources: MatchLineupSource[]): MatchLineupResult {
  const text = response.content?.find((block) => block.type === "text")?.text;
  if (!text) {
    throw new LineupExtractionError("Claude returned no lineup data.", 502);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new LineupExtractionError("Claude returned unreadable lineup data.", 502);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new LineupExtractionError("Claude returned an invalid match lineup.", 502);
  }

  const match = parsed as Record<string, unknown>;
  const lineup = normalizeLineup(match);
  const exactDate = typeof match.exactDate === "string" ? match.exactDate.trim() : "";
  const homeTeam = typeof match.homeTeam === "string" ? match.homeTeam.trim() : "";
  const awayTeam = typeof match.awayTeam === "string" ? match.awayTeam.trim() : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(exactDate) || !homeTeam || !awayTeam) {
    throw new LineupExtractionError("The exact fixture could not be verified.", 422);
  }

  return {
    ...lineup,
    awayTeam,
    competition: typeof match.competition === "string" ? match.competition.trim() : "",
    exactDate,
    homeTeam,
    sources,
  };
}

export async function findMatchLineup(body: unknown) {
  const request = parseRequest(body);
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
  const searchResponse = await anthropicRequest({
    model,
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: [
          `Find the football match between ${request.teamA} and ${request.teamB} closest to ${request.approximateDate}.`,
          `Then find the confirmed lineup for ${request.teamToImport}.`,
          "Search the live web. Prefer official club, competition, federation, or reputable match-report sources.",
          "Verify the exact date, home and away teams, competition, formation, starters, shirt numbers, and substitutes.",
          "Do not use predicted lineups. Do not infer missing players.",
          "If multiple fixtures are similarly plausible, explain the ambiguity instead of choosing silently.",
          "Give a detailed evidence summary with citations for every lineup used.",
        ].join(" "),
      },
    ],
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 4,
      },
    ],
  });
  const evidence = collectSearchEvidence(searchResponse);
  const structuredResponse = await anthropicRequest({
    model,
    max_tokens: 2600,
    messages: [
      {
        role: "user",
        content: [
          "Convert the sourced research below into the requested match lineup JSON.",
          "Use only facts explicitly present in the research. Do not add knowledge from memory.",
          "If the research is ambiguous or lacks confirmed starters, leave fields empty and add warnings.",
          "",
          evidence.text,
        ].join("\n"),
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: matchLineupSchema,
      },
    },
  });

  return parseStructuredMatch(structuredResponse, evidence.sources);
}
