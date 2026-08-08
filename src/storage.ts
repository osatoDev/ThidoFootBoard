import { formations } from "./formations";
import { normalizeArrows } from "./arrowUtils";
import { DEFAULT_FORMATION, createEmptyPlayers, hasPlayerDetails, normalizePlayers } from "./playerUtils";
import type { CurrentLineup, FormationName, Player, SavedLineup } from "./types";

export const CURRENT_STORAGE_KEY = "thido-lineup-builder-current";
export const SAVED_STORAGE_KEY = "thido-lineup-builder-saved";

const LEGACY_LINEUP_FINGERPRINT = "2c7a3a01";

function createEmptyLineup(): CurrentLineup {
  return {
    formation: DEFAULT_FORMATION,
    players: createEmptyPlayers(),
    substitutes: [],
    arrows: [],
    pitchTheme: "classic",
    playerBadges: true,
  };
}

function isBlankLineup(lineup: Partial<CurrentLineup>) {
  return !lineup.players?.some(hasPlayerDetails);
}

function isNumberedPlaceholderLineup(lineup: Partial<CurrentLineup>) {
  return (
    lineup.players?.length === 11 &&
    lineup.players.every((player, index) => !player.name.trim() && player.number === String(index + 1))
  );
}

function fingerprintPlayers(players: Player[] | undefined) {
  if (!players || players.length !== 11) {
    return "";
  }

  const value = players
    .map(({ name, number }) => `${name.trim().toLocaleLowerCase("en-US")}\u0000${number.trim()}`)
    .join("\u0001");
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function isLegacyBundledLineup(lineup: Partial<CurrentLineup>) {
  return fingerprintPlayers(lineup.players) === LEGACY_LINEUP_FINGERPRINT;
}

export function loadCurrentLineup(): CurrentLineup {
  try {
    const raw = window.localStorage.getItem(CURRENT_STORAGE_KEY);
    if (!raw) {
      throw new Error("No current lineup");
    }

    const parsed = JSON.parse(raw) as Partial<CurrentLineup>;
    if (isLegacyBundledLineup(parsed) || isBlankLineup(parsed) || isNumberedPlaceholderLineup(parsed)) {
      throw new Error("Stored lineup should use the default");
    }

    const parsedFormation = parsed.formation;
    const formation: FormationName =
      parsedFormation && Object.prototype.hasOwnProperty.call(formations, parsedFormation)
        ? parsedFormation
        : DEFAULT_FORMATION;

    return {
      formation,
      players: normalizePlayers(parsed.players ?? createEmptyPlayers()),
      substitutes: parsed.substitutes ?? [],
      arrows: normalizeArrows(parsed.arrows),
      pitchTheme: parsed.pitchTheme === "dark" ? "dark" : "classic",
      playerBadges: parsed.playerBadges ?? true,
    };
  } catch {
    return createEmptyLineup();
  }
}

export function loadSavedLineups() {
  try {
    const raw = window.localStorage.getItem(SAVED_STORAGE_KEY);
    const savedLineups = raw ? (JSON.parse(raw) as SavedLineup[]) : [];
    return savedLineups.filter((lineup) => !isLegacyBundledLineup(lineup));
  } catch {
    return [];
  }
}

export function createId() {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
