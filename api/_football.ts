type ApiFootballFixtureResponse = {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
    };
    venue?: {
      name?: string | null;
      city?: string | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
    logo?: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo?: string;
    };
    away: {
      id: number;
      name: string;
      logo?: string;
    };
  };
};

type ApiFootballPlayer = {
  player: {
    id?: number;
    name: string;
    number?: number | null;
    pos?: string | null;
    grid?: string | null;
  };
};

type ApiFootballLineupResponse = {
  team: {
    id: number;
    name: string;
    logo?: string;
  };
  formation?: string;
  coach?: {
    id?: number;
    name?: string;
    photo?: string;
  };
  startXI?: ApiFootballPlayer[];
  substitutes?: ApiFootballPlayer[];
};

type ProviderEnvelope<T> = {
  errors: unknown[] | Record<string, string>;
  response: T;
};

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function requiredParam(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function sendError(response: VercelResponse, error: unknown) {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({ error: error.message, details: error.details });
    return;
  }

  response.status(500).json({ error: error instanceof Error ? error.message : "Unexpected server error" });
}

export type VercelRequest = {
  query: Record<string, string | string[] | undefined>;
  method?: string;
};

export type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function teamMatches(sourceName: string, queryName: string) {
  const source = normalizeText(sourceName);
  const query = normalizeText(queryName);
  return source.includes(query) || query.includes(source);
}

async function apiFootballGet<T>(path: string, params: Record<string, string>) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new ApiError("API_FOOTBALL_KEY is not configured", 500);
  }

  const baseUrl = process.env.API_FOOTBALL_BASE_URL ?? "https://v3.football.api-sports.io";
  const url = new URL(`${baseUrl}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new ApiError(`API-Football request failed with ${response.status}`, response.status);
  }

  const body = (await response.json()) as ProviderEnvelope<T>;
  if (Array.isArray(body.errors) ? body.errors.length > 0 : Object.keys(body.errors ?? {}).length > 0) {
    throw new ApiError("API-Football returned an error", 502, body.errors);
  }

  return body.response;
}

function normalizeFixture(fixture: ApiFootballFixtureResponse) {
  const venueParts = [fixture.fixture.venue?.name, fixture.fixture.venue?.city].filter(Boolean);

  return {
    fixtureId: fixture.fixture.id,
    date: fixture.fixture.date,
    status: fixture.fixture.status.long || fixture.fixture.status.short,
    league: {
      id: fixture.league.id,
      name: fixture.league.name,
      country: fixture.league.country,
      season: fixture.league.season,
      logo: fixture.league.logo,
    },
    venue: venueParts.length > 0 ? venueParts.join(", ") : undefined,
    home: {
      id: fixture.teams.home.id,
      name: fixture.teams.home.name,
      logo: fixture.teams.home.logo,
    },
    away: {
      id: fixture.teams.away.id,
      name: fixture.teams.away.name,
      logo: fixture.teams.away.logo,
    },
  };
}

function normalizePlayer({ player }: ApiFootballPlayer) {
  return {
    id: player.id,
    name: player.name,
    number: player.number == null ? "" : String(player.number),
    role: player.pos ?? "",
    grid: player.grid ?? "",
  };
}

export async function searchFixtures(date: string, teamA: string, teamB: string, timezone: string) {
  const fixtures = await apiFootballGet<ApiFootballFixtureResponse[]>("/fixtures", {
    date,
    timezone,
  });

  return fixtures
    .filter((fixture) => {
      const home = fixture.teams.home.name;
      const away = fixture.teams.away.name;
      return (
        (teamMatches(home, teamA) && teamMatches(away, teamB)) ||
        (teamMatches(home, teamB) && teamMatches(away, teamA))
      );
    })
    .map(normalizeFixture);
}

export async function getLineups(fixtureId: string) {
  const lineups = await apiFootballGet<ApiFootballLineupResponse[]>("/fixtures/lineups", {
    fixture: fixtureId,
  });

  return lineups.map((lineup) => ({
    team: lineup.team,
    formation: lineup.formation ?? "",
    coach: lineup.coach,
    startXI: (lineup.startXI ?? []).map(normalizePlayer),
    substitutes: (lineup.substitutes ?? []).map(normalizePlayer),
  }));
}
