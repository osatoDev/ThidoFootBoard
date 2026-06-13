import { formations } from "./formations";
import { normalizeArrows } from "./arrowUtils";
import { DEFAULT_FORMATION, createEmptyPlayers, hasPlayerDetails, isSamePlayerList, normalizePlayers } from "./playerUtils";
import type { CurrentLineup, FormationName, Player, SavedLineup } from "./types";

export const CURRENT_STORAGE_KEY = "thido-lineup-builder-current";
export const SAVED_STORAGE_KEY = "thido-lineup-builder-saved";

const oldSamplePlayers: Player[] = [
  { name: "Aaron Ramsdale", number: "1" },
  { name: "Ben White", number: "4" },
  { name: "William Saliba", number: "2" },
  { name: "Gabriel Magalhaes", number: "6" },
  { name: "Oleksandr Zinchenko", number: "18" },
  { name: "Thomas Partey", number: "5" },
  { name: "Declan Rice", number: "41" },
  { name: "Martin Odegaard", number: "8" },
  { name: "Bukayo Saka", number: "7" },
  { name: "Eddie Nketiah", number: "9" },
  { name: "Gabriel Martinelli", number: "11" },
];

const oldSampleSubstitutes: Player[] = [
  { name: "David Raya", number: "22" },
  { name: "Jorginho", number: "20" },
  { name: "Leandro Trossard", number: "19" },
];

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

function isOldSampleLineup(lineup: Partial<CurrentLineup>) {
  return (
    lineup.formation === "4-3-3" &&
    isSamePlayerList(lineup.players, oldSamplePlayers) &&
    isSamePlayerList(lineup.substitutes, oldSampleSubstitutes)
  );
}

export function loadCurrentLineup(): CurrentLineup {
  try {
    const raw = window.localStorage.getItem(CURRENT_STORAGE_KEY);
    if (!raw) {
      throw new Error("No current lineup");
    }

    const parsed = JSON.parse(raw) as Partial<CurrentLineup>;
    if (isOldSampleLineup(parsed) || isBlankLineup(parsed)) {
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
    return raw ? (JSON.parse(raw) as SavedLineup[]) : [];
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
