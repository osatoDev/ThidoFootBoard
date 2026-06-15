import { isFormationName } from "./playerUtils";
import type { FormationName, ManualLineupImport, Player } from "./types";

type ImportRecord = Record<string, unknown>;

const starterKeys = ["players", "startingXI", "startingXi", "startXI", "starters"];
const substituteKeys = ["substitutes", "subs", "bench"];

function isRecord(value: unknown): value is ImportRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  return "";
}

function findArray(record: ImportRecord, keys: string[]) {
  for (const key of keys) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[];
    }
  }
  return [];
}

function parsePlayer(value: unknown): Player | null {
  if (typeof value === "string") {
    return parsePlayerText(value);
  }

  if (!isRecord(value)) {
    return null;
  }

  const nested = isRecord(value.player) ? value.player : value;
  const name =
    stringValue(nested.name) ||
    stringValue(nested.playerName) ||
    [stringValue(nested.firstName), stringValue(nested.lastName)].filter(Boolean).join(" ");
  const number =
    stringValue(nested.number) || stringValue(nested.shirtNumber) || stringValue(nested.jerseyNumber);

  return name || number ? { name, number } : null;
}

function parsePlayerText(value: string): Player | null {
  const clean = value
    .replace(/^[\s\-*•]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) {
    return null;
  }

  const leadingNumber = clean.match(/^#?(\d{1,3})[.)\s-]+(.+)$/);
  if (leadingNumber) {
    return { name: leadingNumber[2].trim(), number: leadingNumber[1] };
  }

  const trailingNumber = clean.match(/^(.+?)\s*(?:\(#?(\d{1,3})\)|#(\d{1,3}))$/);
  if (trailingNumber) {
    return { name: trailingNumber[1].trim(), number: trailingNumber[2] || trailingNumber[3] };
  }

  return { name: clean, number: "" };
}

function normalizedPlayers(values: unknown[]) {
  return values.map(parsePlayer).filter((player): player is Player => player !== null);
}

function splitPlayers(value: string) {
  return value
    .split(/[,;\n|]+/)
    .map(parsePlayerText)
    .filter((player): player is Player => player !== null);
}

function normalizeFormation(value: unknown): FormationName | undefined {
  const formation = stringValue(value).replace(/\s+/g, "");
  return isFormationName(formation) ? formation : undefined;
}

function assertPlayers(lineup: ManualLineupImport) {
  if (lineup.players.length === 0) {
    throw new Error("No starting players were found in this import.");
  }
  return lineup;
}

export function parseJsonLineup(source: string): ManualLineupImport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error("This file does not contain valid JSON.");
  }

  if (Array.isArray(parsed)) {
    const players = normalizedPlayers(parsed);
    return assertPlayers({
      players: players.slice(0, 11),
      substitutes: players.slice(11),
    });
  }

  if (!isRecord(parsed)) {
    throw new Error("The JSON lineup must be an object or an array of players.");
  }

  const team = isRecord(parsed.team) ? parsed.team : null;
  const players = normalizedPlayers(findArray(parsed, starterKeys));
  const substitutes = normalizedPlayers(findArray(parsed, substituteKeys));

  return assertPlayers({
    formation: normalizeFormation(parsed.formation),
    name: stringValue(parsed.name) || stringValue(team?.name) || undefined,
    players: players.slice(0, 11),
    substitutes: [...players.slice(11), ...substitutes],
  });
}

function parseCsvRows(source: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  row.push(field.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }
  return rows;
}

export function parseCsvLineup(source: string): ManualLineupImport {
  const rows = parseCsvRows(source);
  if (rows.length === 0) {
    throw new Error("The CSV file is empty.");
  }

  const normalizedHeader = rows[0].map((cell) => cell.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const hasHeader = normalizedHeader.some((cell) =>
    ["name", "player", "playername", "number", "shirtnumber", "section", "type", "status"].includes(cell),
  );
  const header = hasHeader ? normalizedHeader : ["number", "name", "section"];
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const players: Player[] = [];
  const substitutes: Player[] = [];
  let formation: FormationName | undefined;
  let name = "";

  dataRows.forEach((cells) => {
    const record = Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""]));
    const playerName = record.name || record.player || record.playername || "";
    const number = record.number || record.shirtnumber || record.jerseynumber || "";
    const section = (record.section || record.type || record.status || "starter").toLowerCase();
    formation ||= normalizeFormation(record.formation);
    name ||= record.team || record.lineup || "";

    if (!playerName && !number) {
      return;
    }

    const target = /sub|bench/.test(section) ? substitutes : players;
    target.push({ name: playerName, number });
  });

  return assertPlayers({
    formation,
    name: name || undefined,
    players: players.slice(0, 11),
    substitutes: [...players.slice(11), ...substitutes],
  });
}

export function parseTextLineup(source: string): ManualLineupImport {
  const formationMatch = source.match(/\b([345](?:\s*-\s*[1-5]){2,3})\b/);
  const formation = normalizeFormation(formationMatch?.[1]);
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const players: Player[] = [];
  const substitutes: Player[] = [];
  let section: "players" | "substitutes" = "players";
  let name = "";

  lines.forEach((line) => {
    if (/^formation\s*:/i.test(line)) {
      return;
    }

    const sectionMatch = line.match(/^(substitutes?|subs?|bench|starting\s*(?:xi|11)|starters?)\s*:?\s*(.*)$/i);
    if (sectionMatch) {
      section = /sub|bench/i.test(sectionMatch[1]) ? "substitutes" : "players";
      const inlinePlayers = splitPlayers(sectionMatch[2]);
      (section === "players" ? players : substitutes).push(...inlinePlayers);
      return;
    }

    const xiMatch = line.match(/^(.+?)\s+(?:xi|lineup)(?:\s*\([^)]*\))?\s*:?\s*(.*)$/i);
    if (xiMatch) {
      name = xiMatch[1].trim();
      if (xiMatch[2]) {
        players.push(...splitPlayers(xiMatch[2]));
      }
      return;
    }

    (section === "players" ? players : substitutes).push(...splitPlayers(line));
  });

  return assertPlayers({
    formation,
    name: name || undefined,
    players: players.slice(0, 11),
    substitutes: [...players.slice(11), ...substitutes],
  });
}
