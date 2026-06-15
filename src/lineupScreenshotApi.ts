import type { FormationName, Player } from "./types";

export type ExtractedLineupPlayer = Player & {
  confidence: number;
};

export type AiLineupExtraction = {
  formation?: FormationName;
  name: string;
  players: ExtractedLineupPlayer[];
  substitutes: ExtractedLineupPlayer[];
  warnings: string[];
  match?: {
    awayTeam: string;
    competition: string;
    exactDate: string;
    homeTeam: string;
    sources: Array<{
      title: string;
      url: string;
    }>;
  };
};

type ExtractionResponse = {
  error?: string;
  lineup?: {
    formation?: unknown;
    name?: unknown;
    players?: unknown;
    substitutes?: unknown;
    warnings?: unknown;
  };
};

type MatchExtractionResponse = ExtractionResponse & {
  lineup?: NonNullable<ExtractionResponse["lineup"]> & {
    awayTeam?: unknown;
    competition?: unknown;
    exactDate?: unknown;
    homeTeam?: unknown;
    sources?: unknown;
  };
};

const supportedMediaTypes = ["image/jpeg", "image/png", "image/webp"];
const supportedFormations = new Set<FormationName>([
  "4-3-3",
  "4-2-3-1",
  "3-5-2",
  "4-4-2",
  "4-1-4-1",
  "4-3-2-1",
  "3-4-3",
  "3-4-2-1",
  "5-3-2",
  "5-4-1",
]);

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not prepare this screenshot."));
        }
      },
      "image/webp",
      0.92,
    );
  });
}

async function prepareScreenshot(file: File) {
  if (!supportedMediaTypes.includes(file.type)) {
    throw new Error("Use a PNG, JPEG, or WebP screenshot.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("The screenshot must be smaller than 10 MB.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const maxEdge = 1568;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not prepare this screenshot.");
    }

    context.drawImage(bitmap, 0, 0, width, height);
    return canvasToBlob(canvas);
  } finally {
    bitmap.close();
  }
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const data = result.split(",")[1];
      if (!data) {
        reject(new Error("Could not read this screenshot."));
        return;
      }
      resolve(data);
    };
    reader.onerror = () => reject(new Error("Could not read this screenshot."));
    reader.readAsDataURL(blob);
  });
}

function normalizePlayers(value: unknown): ExtractedLineupPlayer[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return [];
    }

    const player = entry as Record<string, unknown>;
    const name = typeof player.name === "string" ? player.name : "";
    const number = typeof player.number === "string" ? player.number : "";
    const confidence =
      typeof player.confidence === "number" && Number.isFinite(player.confidence)
        ? Math.min(1, Math.max(0, player.confidence))
        : 0;
    return name || number ? [{ name, number, confidence }] : [];
  });
}

function normalizeExtraction(lineup: NonNullable<ExtractionResponse["lineup"]>): AiLineupExtraction {
  const formation =
    typeof lineup.formation === "string" && supportedFormations.has(lineup.formation as FormationName)
      ? (lineup.formation as FormationName)
      : undefined;
  const players = normalizePlayers(lineup.players);
  if (players.length === 0) {
    throw new Error("No starting players could be read from this screenshot.");
  }

  return {
    formation,
    name: typeof lineup.name === "string" ? lineup.name : "",
    players,
    substitutes: normalizePlayers(lineup.substitutes),
    warnings: Array.isArray(lineup.warnings)
      ? lineup.warnings.filter((warning): warning is string => typeof warning === "string")
      : [],
  };
}

export async function extractLineupScreenshot(file: File, signal?: AbortSignal) {
  const prepared = await prepareScreenshot(file);
  const data = await blobToBase64(prepared);
  const response = await fetch("/api/lineups/extract", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      image: {
        data,
        mediaType: prepared.type || "image/webp",
      },
    }),
    signal,
  });
  const body = (await response.json()) as ExtractionResponse;

  if (!response.ok || !body.lineup) {
    throw new Error(body.error || "Could not extract this lineup.");
  }

  return normalizeExtraction(body.lineup);
}

export async function findMatchLineup(
  input: {
    approximateDate: string;
    teamA: string;
    teamB: string;
    teamToImport: "teamA" | "teamB";
  },
  signal?: AbortSignal,
) {
  const response = await fetch("/api/lineups/find", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
    signal,
  });
  const body = (await response.json()) as MatchExtractionResponse;

  if (!response.ok || !body.lineup) {
    throw new Error(body.error || "Could not find this match lineup.");
  }

  const extraction = normalizeExtraction(body.lineup);
  const sources = Array.isArray(body.lineup.sources)
    ? body.lineup.sources.flatMap((source) => {
        if (!source || typeof source !== "object" || Array.isArray(source)) {
          return [];
        }
        const record = source as Record<string, unknown>;
        return typeof record.url === "string"
          ? [
              {
                title: typeof record.title === "string" ? record.title : record.url,
                url: record.url,
              },
            ]
          : [];
      })
    : [];
  const exactDate = typeof body.lineup.exactDate === "string" ? body.lineup.exactDate : "";
  const homeTeam = typeof body.lineup.homeTeam === "string" ? body.lineup.homeTeam : "";
  const awayTeam = typeof body.lineup.awayTeam === "string" ? body.lineup.awayTeam : "";

  if (!exactDate || !homeTeam || !awayTeam || sources.length === 0) {
    throw new Error("The exact fixture and its sources could not be verified.");
  }

  return {
    ...extraction,
    match: {
      awayTeam,
      competition: typeof body.lineup.competition === "string" ? body.lineup.competition : "",
      exactDate,
      homeTeam,
      sources,
    },
  } satisfies AiLineupExtraction;
}
