import cors from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";

type ApiFootballFixtureResponse = {
  fixture: {
    id: number;
    date: string;
    timezone: string;
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
    round?: string;
    logo?: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo?: string;
      winner?: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo?: string;
      winner?: boolean | null;
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
  get: string;
  parameters: Record<string, string>;
  errors: unknown[] | Record<string, string>;
  results: number;
  paging?: {
    current: number;
    total: number;
  };
  response: T;
};

const app = express();
const port = Number(process.env.PORT ?? 8787);
const apiFootballBaseUrl = process.env.API_FOOTBALL_BASE_URL ?? "https://v3.football.api-sports.io";

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://127.0.0.1:5174" }));
app.use(express.json());

function requiredQuery(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

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
    throw Object.assign(new Error("API_FOOTBALL_KEY is not configured"), { statusCode: 500 });
  }

  const url = new URL(`${apiFootballBaseUrl}${path}`);
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
    throw Object.assign(new Error(`API-Football request failed with ${response.status}`), {
      statusCode: response.status,
    });
  }

  const body = (await response.json()) as ProviderEnvelope<T>;
  if (Array.isArray(body.errors) ? body.errors.length > 0 : Object.keys(body.errors ?? {}).length > 0) {
    throw Object.assign(new Error("API-Football returned an error"), {
      statusCode: 502,
      details: body.errors,
    });
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

app.get("/api/health", (_request: Request, response: Response) => {
  response.json({
    ok: true,
    provider: "api-football",
    hasApiKey: Boolean(process.env.API_FOOTBALL_KEY),
  });
});

app.get("/api/matches/search", async (request: Request, response: Response, next) => {
  try {
    const date = requiredQuery(request.query.date);
    const teamA = requiredQuery(request.query.teamA);
    const teamB = requiredQuery(request.query.teamB);
    const timezone = requiredQuery(request.query.timezone) ?? "Europe/Berlin";

    if (!date || !teamA || !teamB) {
      response.status(400).json({ error: "date, teamA, and teamB are required" });
      return;
    }

    const fixtures = await apiFootballGet<ApiFootballFixtureResponse[]>("/fixtures", {
      date,
      timezone,
    });

    const matches = fixtures
      .filter((fixture) => {
        const home = fixture.teams.home.name;
        const away = fixture.teams.away.name;
        return (
          (teamMatches(home, teamA) && teamMatches(away, teamB)) ||
          (teamMatches(home, teamB) && teamMatches(away, teamA))
        );
      })
      .map(normalizeFixture);

    response.json({ matches });
  } catch (error) {
    next(error);
  }
});

app.get("/api/matches/:fixtureId/lineups", async (request: Request, response: Response, next) => {
  try {
    const fixtureId = requiredQuery(request.params.fixtureId);
    if (!fixtureId) {
      response.status(400).json({ error: "fixtureId is required" });
      return;
    }

    const lineups = await apiFootballGet<ApiFootballLineupResponse[]>("/fixtures/lineups", {
      fixture: fixtureId,
    });

    response.json({
      fixtureId: Number(fixtureId),
      lineups: lineups.map((lineup) => ({
        team: lineup.team,
        formation: lineup.formation ?? "",
        coach: lineup.coach,
        startXI: (lineup.startXI ?? []).map(normalizePlayer),
        substitutes: (lineup.substitutes ?? []).map(normalizePlayer),
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.use(
  (
    error: Error & { statusCode?: number; details?: unknown },
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    const statusCode = error.statusCode ?? 500;
    response.status(statusCode).json({
      error: error.message,
      details: error.details,
    });
  },
);

app.listen(port, () => {
  console.log(`Thido lineup backend listening on http://127.0.0.1:${port}`);
});
