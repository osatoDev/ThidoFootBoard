const supportedMediaTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const supportedFormations = [
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
] as const;

type SupportedMediaType = (typeof supportedMediaTypes)[number];

type ScreenshotRequest = {
  image?: {
    data?: unknown;
    mediaType?: unknown;
  };
};

type ClaudeMessageResponse = {
  content?: Array<{
    text?: string;
    type?: string;
  }>;
  error?: {
    message?: string;
  };
  stop_reason?: string;
};

export type ExtractedPlayer = {
  confidence: number;
  name: string;
  number: string;
};

export type ExtractedLineup = {
  formation: string;
  name: string;
  players: ExtractedPlayer[];
  substitutes: ExtractedPlayer[];
  warnings: string[];
};

export class LineupExtractionError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const playerSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Player name exactly as visible. Use an empty string when unreadable.",
    },
    number: {
      type: "string",
      description: "Shirt number as digits only. Use an empty string when absent or unreadable.",
    },
    confidence: {
      type: "number",
      description: "Extraction confidence from 0 to 1.",
    },
  },
  required: ["name", "number", "confidence"],
  additionalProperties: false,
} as const;

const lineupSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Team or lineup name visible in the image, otherwise an empty string.",
    },
    formation: {
      type: "string",
      enum: ["", ...supportedFormations],
      description: "Detected formation, or an empty string when it cannot be determined.",
    },
    players: {
      type: "array",
      items: playerSchema,
      description: "Starting players in goalkeeper-to-forward order when the layout makes that possible.",
    },
    substitutes: {
      type: "array",
      items: playerSchema,
      description: "Bench or substitute players visible in the image.",
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      description: "Short notes about ambiguity, unreadable text, or missing lineup information.",
    },
  },
  required: ["name", "formation", "players", "substitutes", "warnings"],
  additionalProperties: false,
} as const;

function isSupportedMediaType(value: unknown): value is SupportedMediaType {
  return typeof value === "string" && supportedMediaTypes.includes(value as SupportedMediaType);
}

function clampConfidence(value: unknown) {
  const confidence = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.min(1, Math.max(0, confidence));
}

function normalizePlayer(value: unknown): ExtractedPlayer | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const player = value as Record<string, unknown>;
  const name = typeof player.name === "string" ? player.name.trim() : "";
  const number = typeof player.number === "string" ? player.number.replace(/\D/g, "").slice(0, 3) : "";
  if (!name && !number) {
    return null;
  }

  return {
    confidence: clampConfidence(player.confidence),
    name,
    number,
  };
}

export function normalizeLineup(value: unknown): ExtractedLineup {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new LineupExtractionError("Claude returned an invalid lineup.", 502);
  }

  const lineup = value as Record<string, unknown>;
  const players = Array.isArray(lineup.players) ? lineup.players.map(normalizePlayer).filter(Boolean) : [];
  const substitutes = Array.isArray(lineup.substitutes)
    ? lineup.substitutes.map(normalizePlayer).filter(Boolean)
    : [];
  const formation =
    typeof lineup.formation === "string" &&
    supportedFormations.includes(lineup.formation as (typeof supportedFormations)[number])
      ? lineup.formation
      : "";
  const warnings = Array.isArray(lineup.warnings)
    ? lineup.warnings.filter((warning): warning is string => typeof warning === "string").slice(0, 10)
    : [];

  if (players.length === 0) {
    throw new LineupExtractionError("No starting players could be read from this screenshot.", 422, {
      warnings,
    });
  }

  return {
    formation,
    name: typeof lineup.name === "string" ? lineup.name.trim() : "",
    players: players.slice(0, 11) as ExtractedPlayer[],
    substitutes: [...players.slice(11), ...substitutes].slice(0, 20) as ExtractedPlayer[],
    warnings,
  };
}

function parseScreenshotRequest(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new LineupExtractionError("A screenshot is required.", 400);
  }

  const image = (body as ScreenshotRequest).image;
  if (!image || !isSupportedMediaType(image.mediaType) || typeof image.data !== "string") {
    throw new LineupExtractionError("Use a PNG, JPEG, or WebP screenshot.", 400);
  }

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(image.data)) {
    throw new LineupExtractionError("The screenshot data is invalid.", 400);
  }

  const decodedBytes = Math.floor((image.data.length * 3) / 4);
  if (decodedBytes > 10 * 1024 * 1024) {
    throw new LineupExtractionError("The screenshot must be smaller than 10 MB.", 413);
  }

  return {
    data: image.data,
    mediaType: image.mediaType,
  };
}

export async function extractLineupFromScreenshot(body: unknown) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new LineupExtractionError("Screenshot extraction is not configured.", 503);
  }

  const image = parseScreenshotRequest(body);
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(60_000),
    headers: {
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      max_tokens: 2400,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: image.mediaType,
                data: image.data,
              },
            },
            {
              type: "text",
              text: [
                "Extract the football lineup shown in this image.",
                "Read only information visibly supported by the image.",
                "Do not invent missing names, numbers, formation, or substitutes.",
                "Keep starters separate from substitutes.",
                "Order starters from goalkeeper through defenders, midfielders, and forwards when the layout allows it.",
                "Use warnings for uncertainty and assign lower confidence to unclear text.",
              ].join(" "),
            },
          ],
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: lineupSchema,
        },
      },
    }),
  });

  const responseBody = (await response.json()) as ClaudeMessageResponse;
  if (!response.ok) {
    throw new LineupExtractionError(
      responseBody.error?.message || `Claude request failed with ${response.status}.`,
      response.status >= 400 && response.status < 500 ? 400 : 502,
    );
  }

  if (responseBody.stop_reason === "max_tokens") {
    throw new LineupExtractionError("Claude could not finish reading this screenshot.", 502);
  }

  const text = responseBody.content?.find((block) => block.type === "text")?.text;
  if (!text) {
    throw new LineupExtractionError("Claude returned no lineup data.", 502);
  }

  try {
    return normalizeLineup(JSON.parse(text));
  } catch (error) {
    if (error instanceof LineupExtractionError) {
      throw error;
    }
    throw new LineupExtractionError("Claude returned unreadable lineup data.", 502);
  }
}
