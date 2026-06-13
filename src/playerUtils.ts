import { formations } from "./formations";
import type { FormationName, ImportedLineupPlayer, Player } from "./types";

export const DEFAULT_FORMATION: FormationName = "4-2-3-1";

export function createEmptyPlayers(): Player[] {
  return Array.from({ length: 11 }, (_, index) => ({ name: "", number: String(index + 1) }));
}

export function stripCustomPositions(players: Player[]): Player[] {
  return players.map(({ name, number }) => ({ name, number }));
}

export function normalizePlayers(players: Player[]) {
  const merged = [...players.slice(0, 11), ...createEmptyPlayers()];
  return merged.slice(0, 11).map((player) => ({
    name: player.name ?? "",
    number: player.number ?? "",
    customX: player.customX,
    customY: player.customY,
  }));
}

export function hasPlayerDetails(player: Player) {
  return player.name.trim().length > 0 || player.number.trim().length > 0;
}

export function isSamePlayerList(players: Player[] | undefined, comparison: Player[]) {
  if (!players || players.length !== comparison.length) {
    return false;
  }

  return players.every(
    (player, index) => player.name === comparison[index].name && player.number === comparison[index].number,
  );
}

export function displayName(player: Player, role: string) {
  return player.name.trim() || role;
}

export function shortName(name: string) {
  const clean = name.trim();
  if (!clean) {
    return "";
  }

  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function isFormationName(value: string): value is FormationName {
  return Object.prototype.hasOwnProperty.call(formations, value);
}

export function normalizeTeamText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function teamNameMatches(sourceName: string, queryName: string) {
  const source = normalizeTeamText(sourceName);
  const query = normalizeTeamText(queryName);
  return source.includes(query) || query.includes(source);
}

export function mapGridToPitchPlayers(importedPlayers: ImportedLineupPlayer[]): Player[] {
  const parsedGrid = importedPlayers.map((player) => {
    const [rowValue, columnValue] = player.grid.split(":").map(Number);
    return {
      player,
      row: Number.isFinite(rowValue) ? rowValue : null,
      column: Number.isFinite(columnValue) ? columnValue : null,
    };
  });

  const rows = parsedGrid
    .map((entry) => entry.row)
    .filter((row): row is number => row !== null && row > 0);
  const maxRow = Math.max(...rows, 1);

  const columnsByRow = parsedGrid.reduce<Record<number, number>>((columns, entry) => {
    if (entry.row && entry.column) {
      columns[entry.row] = Math.max(columns[entry.row] ?? 0, entry.column);
    }
    return columns;
  }, {});

  return parsedGrid.map(({ player, row, column }) => {
    if (!row || !column) {
      return {
        name: player.name,
        number: player.number,
      };
    }

    const columnsInRow = columnsByRow[row] || 1;
    const x = columnsInRow === 1 ? 50 : (column / (columnsInRow + 1)) * 100;
    const y = maxRow === 1 ? 90 : 90 - ((row - 1) / (maxRow - 1)) * 68;

    return {
      name: player.name,
      number: player.number,
      customX: Number(clamp(x, 10, 90).toFixed(2)),
      customY: Number(clamp(y, 18, 92).toFixed(2)),
    };
  });
}
