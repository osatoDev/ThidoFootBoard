import { formations } from "./formations";
import type { FormationName, Player } from "./types";

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

export function isFormationName(value: string): value is FormationName {
  return Object.prototype.hasOwnProperty.call(formations, value);
}
