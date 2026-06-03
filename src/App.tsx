import {
  ArrowLeftRight,
  CalendarDays,
  ChevronDown,
  Download,
  FolderOpen,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Trash2,
  UserRound,
  Users,
  Search,
} from "lucide-react";
import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";

type FormationName =
  | "4-3-3"
  | "4-2-3-1"
  | "3-5-2"
  | "4-4-2"
  | "4-1-4-1"
  | "4-3-2-1"
  | "3-4-3"
  | "3-4-2-1"
  | "5-3-2"
  | "5-4-1";

type PositionCoordinate = {
  role: string;
  x: number;
  y: number;
};

export type Player = {
  name: string;
  number: string;
  customX?: number;
  customY?: number;
};

type SavedLineup = {
  id: string;
  name: string;
  formation: FormationName;
  players: Player[];
  substitutes: Player[];
  createdAt: number;
};

type CurrentLineup = {
  formation: FormationName;
  players: Player[];
  substitutes: Player[];
  pitchTheme: PitchTheme;
  playerBadges: boolean;
};

type PitchTheme = "classic" | "dark";
type EditorTab = "starting" | "substitutes";
type MatchLoadSide = "teamA" | "teamB";

type MatchSummary = {
  fixtureId: number;
  date: string;
  status: string;
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
    logo?: string;
  };
  venue?: string;
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

type ImportedLineupPlayer = {
  id?: number;
  name: string;
  number: string;
  role: string;
  grid: string;
};

type ImportedLineup = {
  team: {
    id: number;
    name: string;
    logo?: string;
  };
  formation: string;
  coach?: {
    id?: number;
    name?: string;
    photo?: string;
  };
  startXI: ImportedLineupPlayer[];
  substitutes: ImportedLineupPlayer[];
};

const quickFormations: FormationName[] = ["4-3-3", "4-2-3-1", "3-5-2"];
const moreFormations: FormationName[] = [
  "4-4-2",
  "4-1-4-1",
  "4-3-2-1",
  "3-4-3",
  "3-4-2-1",
  "5-3-2",
  "5-4-1",
];

const CURRENT_STORAGE_KEY = "thido-lineup-builder-current";
const SAVED_STORAGE_KEY = "thido-lineup-builder-saved";

const samplePlayers: Player[] = [
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

const initialSubstitutes: Player[] = [
  { name: "David Raya", number: "22" },
  { name: "Jorginho", number: "20" },
  { name: "Leandro Trossard", number: "19" },
];

const formations: Record<FormationName, PositionCoordinate[]> = {
  "4-3-3": [
    { role: "GK", x: 50, y: 90 },
    { role: "RB", x: 82, y: 72 },
    { role: "CB", x: 62, y: 72 },
    { role: "CB", x: 38, y: 72 },
    { role: "LB", x: 18, y: 72 },
    { role: "CM", x: 35, y: 52 },
    { role: "CM", x: 50, y: 48 },
    { role: "CM", x: 65, y: 52 },
    { role: "RW", x: 78, y: 28 },
    { role: "ST", x: 50, y: 22 },
    { role: "LW", x: 22, y: 28 },
  ],
  "4-2-3-1": [
    { role: "GK", x: 50, y: 90 },
    { role: "RB", x: 82, y: 74 },
    { role: "CB", x: 62, y: 75 },
    { role: "CB", x: 38, y: 75 },
    { role: "LB", x: 18, y: 74 },
    { role: "DM", x: 42, y: 57 },
    { role: "DM", x: 58, y: 57 },
    { role: "AM", x: 50, y: 42 },
    { role: "RW", x: 78, y: 34 },
    { role: "ST", x: 50, y: 22 },
    { role: "LW", x: 22, y: 34 },
  ],
  "3-5-2": [
    { role: "GK", x: 50, y: 90 },
    { role: "RCB", x: 68, y: 75 },
    { role: "CB", x: 50, y: 78 },
    { role: "LCB", x: 32, y: 75 },
    { role: "RWB", x: 84, y: 55 },
    { role: "CM", x: 38, y: 52 },
    { role: "CM", x: 50, y: 48 },
    { role: "CM", x: 62, y: 52 },
    { role: "LWB", x: 16, y: 55 },
    { role: "ST", x: 58, y: 25 },
    { role: "ST", x: 42, y: 25 },
  ],
  "4-4-2": [
    { role: "GK", x: 50, y: 90 },
    { role: "RB", x: 82, y: 74 },
    { role: "CB", x: 62, y: 75 },
    { role: "CB", x: 38, y: 75 },
    { role: "LB", x: 18, y: 74 },
    { role: "RM", x: 78, y: 50 },
    { role: "CM", x: 58, y: 50 },
    { role: "CM", x: 42, y: 50 },
    { role: "LM", x: 22, y: 50 },
    { role: "ST", x: 58, y: 25 },
    { role: "ST", x: 42, y: 25 },
  ],
  "4-1-4-1": [
    { role: "GK", x: 50, y: 90 },
    { role: "RB", x: 82, y: 74 },
    { role: "CB", x: 62, y: 75 },
    { role: "CB", x: 38, y: 75 },
    { role: "LB", x: 18, y: 74 },
    { role: "DM", x: 50, y: 61 },
    { role: "RM", x: 78, y: 45 },
    { role: "CM", x: 58, y: 46 },
    { role: "CM", x: 42, y: 46 },
    { role: "LM", x: 22, y: 45 },
    { role: "ST", x: 50, y: 24 },
  ],
  "4-3-2-1": [
    { role: "GK", x: 50, y: 90 },
    { role: "RB", x: 82, y: 74 },
    { role: "CB", x: 62, y: 75 },
    { role: "CB", x: 38, y: 75 },
    { role: "LB", x: 18, y: 74 },
    { role: "CM", x: 65, y: 54 },
    { role: "CM", x: 50, y: 51 },
    { role: "CM", x: 35, y: 54 },
    { role: "RAM", x: 58, y: 36 },
    { role: "ST", x: 50, y: 22 },
    { role: "LAM", x: 42, y: 36 },
  ],
  "3-4-3": [
    { role: "GK", x: 50, y: 90 },
    { role: "RCB", x: 68, y: 75 },
    { role: "CB", x: 50, y: 78 },
    { role: "LCB", x: 32, y: 75 },
    { role: "RM", x: 78, y: 53 },
    { role: "CM", x: 58, y: 51 },
    { role: "CM", x: 42, y: 51 },
    { role: "LM", x: 22, y: 53 },
    { role: "RW", x: 78, y: 29 },
    { role: "ST", x: 50, y: 22 },
    { role: "LW", x: 22, y: 29 },
  ],
  "3-4-2-1": [
    { role: "GK", x: 50, y: 90 },
    { role: "RCB", x: 68, y: 75 },
    { role: "CB", x: 50, y: 78 },
    { role: "LCB", x: 32, y: 75 },
    { role: "RWB", x: 82, y: 54 },
    { role: "CM", x: 58, y: 52 },
    { role: "CM", x: 42, y: 52 },
    { role: "LWB", x: 18, y: 54 },
    { role: "RAM", x: 58, y: 36 },
    { role: "ST", x: 50, y: 22 },
    { role: "LAM", x: 42, y: 36 },
  ],
  "5-3-2": [
    { role: "GK", x: 50, y: 90 },
    { role: "RWB", x: 86, y: 68 },
    { role: "RCB", x: 66, y: 76 },
    { role: "CB", x: 50, y: 78 },
    { role: "LCB", x: 34, y: 76 },
    { role: "LWB", x: 14, y: 68 },
    { role: "CM", x: 62, y: 50 },
    { role: "CM", x: 50, y: 47 },
    { role: "CM", x: 38, y: 50 },
    { role: "ST", x: 58, y: 25 },
    { role: "ST", x: 42, y: 25 },
  ],
  "5-4-1": [
    { role: "GK", x: 50, y: 90 },
    { role: "RWB", x: 86, y: 68 },
    { role: "RCB", x: 66, y: 76 },
    { role: "CB", x: 50, y: 78 },
    { role: "LCB", x: 34, y: 76 },
    { role: "LWB", x: 14, y: 68 },
    { role: "RM", x: 78, y: 49 },
    { role: "CM", x: 58, y: 49 },
    { role: "CM", x: 42, y: 49 },
    { role: "LM", x: 22, y: 49 },
    { role: "ST", x: 50, y: 24 },
  ],
};

function createEmptyPlayers(): Player[] {
  return Array.from({ length: 11 }, () => ({ name: "", number: "" }));
}

function stripCustomPositions(players: Player[]): Player[] {
  return players.map(({ name, number }) => ({ name, number }));
}

function normalizePlayers(players: Player[]) {
  const merged = [...players.slice(0, 11), ...createEmptyPlayers()];
  return merged.slice(0, 11).map((player) => ({
    name: player.name ?? "",
    number: player.number ?? "",
    customX: player.customX,
    customY: player.customY,
  }));
}

function loadCurrentLineup(): CurrentLineup {
  try {
    const raw = window.localStorage.getItem(CURRENT_STORAGE_KEY);
    if (!raw) {
      throw new Error("No current lineup");
    }

    const parsed = JSON.parse(raw) as Partial<CurrentLineup>;
    const parsedFormation = parsed.formation;
    const formation: FormationName =
      parsedFormation && Object.prototype.hasOwnProperty.call(formations, parsedFormation)
        ? parsedFormation
        : "4-3-3";

    return {
      formation,
      players: normalizePlayers(parsed.players ?? samplePlayers),
      substitutes: parsed.substitutes ?? initialSubstitutes,
      pitchTheme: parsed.pitchTheme === "dark" ? "dark" : "classic",
      playerBadges: parsed.playerBadges ?? true,
    };
  } catch {
    return {
      formation: "4-3-3",
      players: samplePlayers,
      substitutes: initialSubstitutes,
      pitchTheme: "classic",
      playerBadges: true,
    };
  }
}

function loadSavedLineups() {
  try {
    const raw = window.localStorage.getItem(SAVED_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedLineup[]) : [];
  } catch {
    return [];
  }
}

function createId() {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function displayName(player: Player, role: string) {
  return player.name.trim() || role;
}

function shortName(name: string) {
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function isFormationName(value: string): value is FormationName {
  return Object.prototype.hasOwnProperty.call(formations, value);
}

function normalizeTeamText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function teamNameMatches(sourceName: string, queryName: string) {
  const source = normalizeTeamText(sourceName);
  const query = normalizeTeamText(queryName);
  return source.includes(query) || query.includes(source);
}

function mapGridToPitchPlayers(importedPlayers: ImportedLineupPlayer[]): Player[] {
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

function App() {
  const initialLineup = useMemo(loadCurrentLineup, []);
  const [formation, setFormation] = useState<FormationName>(initialLineup.formation);
  const [players, setPlayers] = useState<Player[]>(initialLineup.players);
  const [substitutes, setSubstitutes] = useState<Player[]>(initialLineup.substitutes);
  const [pitchTheme, setPitchTheme] = useState<PitchTheme>(initialLineup.pitchTheme);
  const [playerBadges, setPlayerBadges] = useState(initialLineup.playerBadges);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number | null>(null);
  const [draggingPlayerIndex, setDraggingPlayerIndex] = useState<number | null>(null);
  const [editorTab, setEditorTab] = useState<EditorTab>("starting");
  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>(loadSavedLineups);
  const [lineupName, setLineupName] = useState("Arsenal 4-3-3");
  const [selectedSavedId, setSelectedSavedId] = useState("");
  const [matchDate, setMatchDate] = useState(todayInputValue);
  const [teamA, setTeamA] = useState("Arsenal");
  const [teamB, setTeamB] = useState("Tottenham");
  const [matchResults, setMatchResults] = useState<MatchSummary[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [matchImportStatus, setMatchImportStatus] = useState("");
  const [isSearchingMatches, setIsSearchingMatches] = useState(false);
  const [isLoadingLineup, setIsLoadingLineup] = useState(false);
  const [matchLoadSide, setMatchLoadSide] = useState<MatchLoadSide>("teamA");
  const pitchRef = useRef<HTMLDivElement>(null);

  const positionSet = formations[formation];

  useEffect(() => {
    const current: CurrentLineup = {
      formation,
      players,
      substitutes,
      pitchTheme,
      playerBadges,
    };
    window.localStorage.setItem(CURRENT_STORAGE_KEY, JSON.stringify(current));
  }, [formation, players, substitutes, pitchTheme, playerBadges]);

  useEffect(() => {
    window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedLineups));
  }, [savedLineups]);

  function updateFormation(nextFormation: FormationName) {
    setFormation(nextFormation);
    setPlayers((current) => stripCustomPositions(current));
    setSelectedPlayerIndex(null);
    setDraggingPlayerIndex(null);
  }

  function updatePlayer(index: number, field: "name" | "number", value: string) {
    setPlayers((current) =>
      current.map((player, playerIndex) =>
        playerIndex === index
          ? {
              ...player,
              [field]: value,
            }
          : player,
      ),
    );
  }

  function updateSubstitute(index: number, field: "name" | "number", value: string) {
    setSubstitutes((current) =>
      current.map((player, playerIndex) =>
        playerIndex === index
          ? {
              ...player,
              [field]: value,
            }
          : player,
      ),
    );
  }

  function setPlayerPosition(event: PointerEvent, index: number) {
    const pitch = pitchRef.current;
    if (!pitch) {
      return;
    }

    const rect = pitch.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 4, 96);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 5, 95);

    setPlayers((current) =>
      current.map((player, playerIndex) =>
        playerIndex === index
          ? {
              ...player,
              customX: Number(x.toFixed(2)),
              customY: Number(y.toFixed(2)),
            }
          : player,
      ),
    );
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, index: number) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedPlayerIndex(index);
    setDraggingPlayerIndex(index);
    setPlayerPosition(event, index);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>, index: number) {
    if (draggingPlayerIndex !== index) {
      return;
    }

    setPlayerPosition(event, index);
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>, index: number) {
    if (draggingPlayerIndex !== index) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    setDraggingPlayerIndex(null);
  }

  function resetPositions() {
    setPlayers((current) => stripCustomPositions(current));
    setSelectedPlayerIndex(null);
    setDraggingPlayerIndex(null);
  }

  function clearLineup() {
    setFormation("4-3-3");
    setPlayers(createEmptyPlayers());
    setSubstitutes([]);
    setLineupName("Untitled lineup");
    setSelectedPlayerIndex(null);
    setSelectedSavedId("");
  }

  function resetAll() {
    setFormation("4-3-3");
    setPlayers(samplePlayers);
    setSubstitutes(initialSubstitutes);
    setPitchTheme("classic");
    setPlayerBadges(true);
    setLineupName("Arsenal 4-3-3");
    setSelectedPlayerIndex(null);
    setSelectedSavedId("");
  }

  function saveLineup() {
    const name = lineupName.trim() || `${formation} lineup`;
    const save: SavedLineup = {
      id: selectedSavedId || createId(),
      name,
      formation,
      players,
      substitutes,
      createdAt: Date.now(),
    };

    setSavedLineups((current) => {
      const withoutExisting = current.filter((lineup) => lineup.id !== save.id);
      return [save, ...withoutExisting].slice(0, 20);
    });
    setSelectedSavedId(save.id);
    setLineupName(name);
  }

  function loadLineup(id: string) {
    const save = savedLineups.find((lineup) => lineup.id === id);
    if (!save) {
      setSelectedSavedId("");
      return;
    }

    setSelectedSavedId(id);
    setLineupName(save.name);
    setFormation(save.formation);
    setPlayers(normalizePlayers(save.players));
    setSubstitutes(save.substitutes ?? []);
    setSelectedPlayerIndex(null);
  }

  function deleteLineup() {
    if (!selectedSavedId) {
      return;
    }

    setSavedLineups((current) => current.filter((lineup) => lineup.id !== selectedSavedId));
    setSelectedSavedId("");
  }

  function addSubstitute() {
    setSubstitutes((current) => [...current, { name: "", number: "" }]);
    setEditorTab("substitutes");
  }

  function removeSubstitute(index: number) {
    setSubstitutes((current) => current.filter((_, playerIndex) => playerIndex !== index));
  }

  async function fetchMatchResults() {
    const params = new URLSearchParams({
      date: matchDate,
      teamA: teamA.trim(),
      teamB: teamB.trim(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin",
    });
    const response = await fetch(`/api/matches/search?${params.toString()}`);
    const body = (await response.json()) as { matches?: MatchSummary[]; error?: string };

    if (!response.ok) {
      throw new Error(body.error ?? "Could not search matches.");
    }

    return body.matches ?? [];
  }

  function getRequestedTeamId(match: MatchSummary) {
    const requestedTeamName = matchLoadSide === "teamA" ? teamA : teamB;

    if (teamNameMatches(match.home.name, requestedTeamName)) {
      return match.home.id;
    }

    if (teamNameMatches(match.away.name, requestedTeamName)) {
      return match.away.id;
    }

    return matchLoadSide === "teamA" ? match.home.id : match.away.id;
  }

  async function applyImportedLineup(match: MatchSummary, teamId: number) {
    const response = await fetch(`/api/matches/${match.fixtureId}/lineups`);
    const body = (await response.json()) as { lineups?: ImportedLineup[]; error?: string };

    if (!response.ok) {
      throw new Error(body.error ?? "Could not load lineups.");
    }

    const imported = body.lineups?.find((lineup) => lineup.team.id === teamId);
    if (!imported || imported.startXI.length === 0) {
      throw new Error("Lineups are not available yet for that team.");
    }

    if (isFormationName(imported.formation)) {
      setFormation(imported.formation);
    }

    setPlayers(
      normalizePlayers(
        mapGridToPitchPlayers(imported.startXI),
      ),
    );
    setSubstitutes(imported.substitutes.map((player) => ({ name: player.name, number: player.number })));
    setLineupName(`${imported.team.name} ${imported.formation || match.league.name}`);
    setEditorTab("starting");
    setSelectedPlayerIndex(null);
    setDraggingPlayerIndex(null);
    setMatchImportStatus(`Loaded ${imported.team.name}${imported.formation ? ` (${imported.formation})` : ""}.`);
  }

  async function searchMatches() {
    if (!matchDate || !teamA.trim() || !teamB.trim()) {
      setMatchImportStatus("Add a date and both teams.");
      return;
    }

    setIsSearchingMatches(true);
    setMatchImportStatus("");
    setMatchResults([]);
    setSelectedMatchId(null);

    try {
      const matches = await fetchMatchResults();
      setMatchResults(matches);
      setSelectedMatchId(matches[0]?.fixtureId ?? null);
      setMatchImportStatus(matches.length === 0 ? "No matching fixture found for that date." : "");
    } catch (error) {
      setMatchImportStatus(error instanceof Error ? error.message : "Could not search matches.");
    } finally {
      setIsSearchingMatches(false);
    }
  }

  function swapTeams() {
    setTeamA(teamB);
    setTeamB(teamA);
    setMatchResults([]);
    setSelectedMatchId(null);
    setMatchImportStatus("");
  }

  async function findAndLoadLineup() {
    const match = matchResults.find((result) => result.fixtureId === selectedMatchId);
    if (!match) {
      setMatchImportStatus("Choose a match first.");
      return;
    }

    setIsLoadingLineup(true);
    setMatchImportStatus("");

    try {
      await applyImportedLineup(match, getRequestedTeamId(match));
    } catch (error) {
      setMatchImportStatus(error instanceof Error ? error.message : "Could not load the lineup.");
    } finally {
      setIsLoadingLineup(false);
    }
  }

  async function loadImportedLineup(teamId: number) {
    const match = matchResults.find((result) => result.fixtureId === selectedMatchId);
    if (!match) {
      setMatchImportStatus("Choose a match first.");
      return;
    }

    setIsLoadingLineup(true);
    setMatchImportStatus("");

    try {
      await applyImportedLineup(match, teamId);
    } catch (error) {
      setMatchImportStatus(error instanceof Error ? error.message : "Could not load lineups.");
    } finally {
      setIsLoadingLineup(false);
    }
  }

  function renderMatchImportPanel() {
    return (
      <section className="matchImportPanel" aria-label="Match import">
        <div className="matchImportHeader">
          <div>
            <span>Match Import</span>
            <strong>API-Football</strong>
          </div>
          <CalendarDays size={20} aria-hidden="true" />
        </div>

        <div className="matchImportGrid">
          <label>
            <span>Date</span>
            <input
              aria-label="Match date"
              onChange={(event) => setMatchDate(event.target.value)}
              type="date"
              value={matchDate}
            />
          </label>
          <label>
            <span>Team A</span>
            <input
              aria-label="Team A"
              onChange={(event) => setTeamA(event.target.value)}
              placeholder="Arsenal"
              type="text"
              value={teamA}
            />
          </label>
          <label>
            <span>Team B</span>
            <input
              aria-label="Team B"
              onChange={(event) => setTeamB(event.target.value)}
              placeholder="Tottenham"
              type="text"
              value={teamB}
            />
          </label>
        </div>

        <div className="loadSideControl" role="group" aria-label="Team to load">
          <button
            className={matchLoadSide === "teamA" ? "active" : ""}
            onClick={() => setMatchLoadSide("teamA")}
            type="button"
          >
            Load Team A
          </button>
          <button
            className={matchLoadSide === "teamB" ? "active" : ""}
            onClick={() => setMatchLoadSide("teamB")}
            type="button"
          >
            Load Team B
          </button>
        </div>

        <div className="matchImportActions">
          <button className="ghostMiniButton" onClick={swapTeams} type="button">
            <ArrowLeftRight size={17} aria-hidden="true" />
            Swap
          </button>
          <button className="ghostMiniButton" disabled={isSearchingMatches} onClick={searchMatches} type="button">
            <Search size={17} aria-hidden="true" />
            Find Only
          </button>
          <button
            className="primaryMiniButton"
            disabled={!selectedMatchId || isSearchingMatches || isLoadingLineup}
            onClick={findAndLoadLineup}
            type="button"
          >
            <Search size={17} aria-hidden="true" />
            {isLoadingLineup ? "Loading" : "Find & Load"}
          </button>
        </div>

        {matchResults.length > 0 ? (
          <div className="matchResults">
            <label className="selectWrap matchSelect">
              <select
                aria-label="Matched fixtures"
                onChange={(event) => setSelectedMatchId(Number(event.target.value))}
                value={selectedMatchId ?? ""}
              >
                {matchResults.map((match) => (
                  <option key={match.fixtureId} value={match.fixtureId}>
                    {match.home.name} vs {match.away.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </label>

            {matchResults
              .filter((match) => match.fixtureId === selectedMatchId)
              .map((match) => (
                <div className="matchResultCard" key={match.fixtureId}>
                  <div>
                    <strong>
                      {match.home.name} vs {match.away.name}
                    </strong>
                    <span>
                      {match.league.name} · {new Date(match.date).toLocaleDateString()} · {match.status}
                    </span>
                  </div>
                  <div className="lineupLoadButtons">
                    <button disabled={isLoadingLineup} onClick={() => loadImportedLineup(match.home.id)} type="button">
                      Load {match.home.name}
                    </button>
                    <button disabled={isLoadingLineup} onClick={() => loadImportedLineup(match.away.id)} type="button">
                      Load {match.away.name}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : null}

        {matchImportStatus ? <p className="matchImportStatus">{matchImportStatus}</p> : null}
      </section>
    );
  }

  function drawPitchLines(context: CanvasRenderingContext2D, width: number, height: number) {
    context.strokeStyle = "rgba(255,255,255,0.64)";
    context.lineWidth = 5;
    context.strokeRect(width * 0.07, height * 0.06, width * 0.86, height * 0.88);
    context.beginPath();
    context.moveTo(width * 0.07, height * 0.5);
    context.lineTo(width * 0.93, height * 0.5);
    context.stroke();
    context.beginPath();
    context.arc(width * 0.5, height * 0.5, width * 0.12, 0, Math.PI * 2);
    context.stroke();
    context.strokeRect(width * 0.28, height * 0.06, width * 0.44, height * 0.17);
    context.strokeRect(width * 0.38, height * 0.06, width * 0.24, height * 0.08);
    context.strokeRect(width * 0.28, height * 0.77, width * 0.44, height * 0.17);
    context.strokeRect(width * 0.38, height * 0.86, width * 0.24, height * 0.08);
    context.beginPath();
    context.arc(width * 0.5, height * 0.77, width * 0.1, Math.PI, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(width * 0.5, height * 0.23, width * 0.1, 0, Math.PI);
    context.stroke();
  }

  function exportPitchImage() {
    const width = 1800;
    const height = 1400;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const gradient = context.createLinearGradient(0, 0, width, height);
    if (pitchTheme === "dark") {
      gradient.addColorStop(0, "#071712");
      gradient.addColorStop(1, "#153c25");
    } else {
      gradient.addColorStop(0, "#145c25");
      gradient.addColorStop(1, "#2f8f36");
    }
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < 12; index += 1) {
      context.fillStyle = index % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
      context.fillRect(0, (height / 12) * index, width, height / 12);
    }

    drawPitchLines(context, width, height);

    context.font = "700 44px Inter, Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";

    players.forEach((player, index) => {
      const position = positionSet[index];
      const x = ((player.customX ?? position.x) / 100) * width;
      const y = ((player.customY ?? position.y) / 100) * height;
      const label = shortName(player.name) || position.role;
      const labelWidth = Math.max(170, Math.min(320, label.length * 24 + 38));

      context.fillStyle = "rgba(0,0,0,0.42)";
      context.beginPath();
      context.arc(x + 8, y + 8, 58, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#111917";
      context.beginPath();
      context.arc(x, y, 58, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(255,255,255,0.82)";
      context.lineWidth = 4;
      context.stroke();
      context.fillStyle = "#ffffff";
      context.fillText(player.number || String(index + 1), x, y);

      context.fillStyle = "#ffffff";
      context.strokeStyle = "rgba(0,0,0,0.15)";
      context.lineWidth = 2;
      context.beginPath();
      context.roundRect(x - labelWidth / 2, y + 76, labelWidth, 54, 14);
      context.fill();
      context.stroke();
      context.fillStyle = "#111827";
      context.font = "700 26px Inter, Arial, sans-serif";
      context.fillText(label, x, y + 103);
      context.font = "700 44px Inter, Arial, sans-serif";
    });

    const link = document.createElement("a");
    link.download = `${(lineupName.trim() || "thido-lineup").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <main className="appShell">
      <header className="topBar">
        <div className="brandLockup">
          <div className="brandMark" aria-hidden="true">
            <span>T</span>
          </div>
          <div>
            <p className="eyebrow">Thido</p>
            <h1>Lineup Builder</h1>
          </div>
        </div>

        <div className="formationControls" aria-label="Formation controls">
          <div className="controlGroup">
            <span>Quick Formations</span>
            <div className="buttonRow">
              {quickFormations.map((item) => (
                <button
                  className={`formationButton ${formation === item ? "active" : ""}`}
                  key={item}
                  onClick={() => updateFormation(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="controlGroup moreGroup">
            <span>More Formations</span>
            <label className="selectWrap">
              <select
                aria-label="More formations"
                onChange={(event) => updateFormation(event.target.value as FormationName)}
                value={moreFormations.includes(formation) ? formation : ""}
              >
                <option value="" disabled>
                  More Formations
                </option>
                {moreFormations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} aria-hidden="true" />
            </label>
          </div>
        </div>

        <div className="topActions">
          <button className="ghostButton" onClick={clearLineup} type="button">
            <RefreshCcw size={18} aria-hidden="true" />
            Clear
          </button>
          <button className="primaryButton" onClick={exportPitchImage} type="button">
            <Download size={18} aria-hidden="true" />
            Export Image
          </button>
        </div>
      </header>

      <section className="workspace">
        <section className={`pitchPanel ${pitchTheme}`} aria-label="Football pitch">
          <div className="pitchToolbar">
            <label className="selectWrap compactSelect">
              <select
                aria-label="Current formation"
                onChange={(event) => updateFormation(event.target.value as FormationName)}
                value={formation}
              >
                {[...quickFormations, ...moreFormations].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} aria-hidden="true" />
            </label>
          </div>

          <div className="pitch" ref={pitchRef}>
            <div className="pitchLine outerLine" />
            <div className="pitchLine halfLine" />
            <div className="pitchLine centerCircle" />
            <div className="pitchLine topBox" />
            <div className="pitchLine topGoalBox" />
            <div className="pitchLine bottomBox" />
            <div className="pitchLine bottomGoalBox" />
            <div className="pitchLine topArc" />
            <div className="pitchLine bottomArc" />
            <div className="pitchLine corner topLeft" />
            <div className="pitchLine corner topRight" />
            <div className="pitchLine corner bottomLeft" />
            <div className="pitchLine corner bottomRight" />

            {players.map((player, index) => {
              const position = positionSet[index];
              const x = player.customX ?? position.x;
              const y = player.customY ?? position.y;
              const isSelected = selectedPlayerIndex === index;

              return (
                <button
                  aria-label={`${displayName(player, position.role)} ${position.role}`}
                  className={`playerMarker ${isSelected ? "selected" : ""} ${
                    selectedPlayerIndex !== null && !isSelected ? "dimmed" : ""
                  }`}
                  key={`${position.role}-${index}`}
                  onClick={() => setSelectedPlayerIndex(index)}
                  onPointerDown={(event) => handlePointerDown(event, index)}
                  onPointerMove={(event) => handlePointerMove(event, index)}
                  onPointerUp={(event) => handlePointerUp(event, index)}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  type="button"
                >
                  <span className={`playerDisc ${playerBadges ? "withBadge" : ""}`}>
                    {playerBadges ? player.number || index + 1 : <UserRound size={28} aria-hidden="true" />}
                  </span>
                  <span className="playerName">{shortName(player.name) || position.role}</span>
                </button>
              );
            })}
          </div>

          <div className="pitchOptions">
            <div className="segmentedControl" role="group" aria-label="Pitch theme">
              <button
                className={pitchTheme === "classic" ? "active" : ""}
                onClick={() => setPitchTheme("classic")}
                type="button"
              >
                Pitch
              </button>
              <button
                className={pitchTheme === "dark" ? "active" : ""}
                onClick={() => setPitchTheme("dark")}
                type="button"
              >
                Dark
              </button>
            </div>

            <button className="darkToolButton" onClick={() => setPlayerBadges((current) => !current)} type="button">
              <UserRound size={18} aria-hidden="true" />
              {playerBadges ? "Numbers" : "Icons"}
            </button>
          </div>
        </section>

        <aside className="editorPanel">
          <div className="tabs" role="tablist" aria-label="Lineup editor">
            <button
              aria-selected={editorTab === "starting"}
              className={editorTab === "starting" ? "active" : ""}
              onClick={() => setEditorTab("starting")}
              role="tab"
              type="button"
            >
              Starting XI
            </button>
            <button
              aria-selected={editorTab === "substitutes"}
              className={editorTab === "substitutes" ? "active" : ""}
              onClick={() => setEditorTab("substitutes")}
              role="tab"
              type="button"
            >
              Substitutes
            </button>
          </div>

          {editorTab === "starting" ? (
            <div className="playerRows">
              {players.map((player, index) => {
                const role = positionSet[index].role;
                const isSelected = selectedPlayerIndex === index;

                return (
                  <div className={`playerRow ${isSelected ? "selected" : ""}`} key={`row-${index}`}>
                    <button
                      className="rowBadge"
                      onClick={() => setSelectedPlayerIndex(index)}
                      type="button"
                      aria-label={`Select player ${index + 1}`}
                    >
                      {player.number || index + 1}
                    </button>
                    <input
                      aria-label={`${role} player name`}
                      onChange={(event) => updatePlayer(index, "name", event.target.value)}
                      placeholder="Player name"
                      type="text"
                      value={player.name}
                    />
                    <input
                      aria-label={`${role} shirt number`}
                      className="numberInput"
                      inputMode="numeric"
                      onChange={(event) => updatePlayer(index, "number", event.target.value)}
                      placeholder="#"
                      type="text"
                      value={player.number}
                    />
                    <span className="roleLabel">{role}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="playerRows">
              {substitutes.map((player, index) => (
                <div className="playerRow substituteRow" key={`sub-${index}`}>
                  <div className="rowBadge">
                    <Users size={17} aria-hidden="true" />
                  </div>
                  <input
                    aria-label={`Substitute ${index + 1} name`}
                    onChange={(event) => updateSubstitute(index, "name", event.target.value)}
                    placeholder="Player name"
                    type="text"
                    value={player.name}
                  />
                  <input
                    aria-label={`Substitute ${index + 1} shirt number`}
                    className="numberInput"
                    inputMode="numeric"
                    onChange={(event) => updateSubstitute(index, "number", event.target.value)}
                    placeholder="#"
                    type="text"
                    value={player.number}
                  />
                  <button
                    className="iconButton"
                    onClick={() => removeSubstitute(index)}
                    type="button"
                    aria-label="Remove substitute"
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              ))}
              {substitutes.length === 0 ? <p className="emptyState">No substitutes</p> : null}
            </div>
          )}

          <div className="panelActions">
            <button className="textButton" onClick={addSubstitute} type="button">
              <Plus size={18} aria-hidden="true" />
              Add Player
            </button>
            <button className="textButton" onClick={resetAll} type="button">
              <RefreshCcw size={18} aria-hidden="true" />
              Reset All
            </button>
            <button className="textButton" onClick={resetPositions} type="button">
              <RotateCcw size={18} aria-hidden="true" />
              Reset Positions
            </button>
          </div>

          {renderMatchImportPanel()}

          <div className="libraryPanel">
            <div className="libraryHeader">
              <FolderOpen size={18} aria-hidden="true" />
              <span>Lineups</span>
            </div>
            <div className="saveGrid">
              <input
                aria-label="Lineup name"
                onChange={(event) => setLineupName(event.target.value)}
                placeholder="Lineup name"
                type="text"
                value={lineupName}
              />
              <button className="saveButton" onClick={saveLineup} type="button" aria-label="Save lineup">
                <Save size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="saveGrid">
              <label className="selectWrap librarySelect">
                <select
                  aria-label="Saved lineups"
                  onChange={(event) => loadLineup(event.target.value)}
                  value={selectedSavedId}
                >
                  <option value="">Saved lineups</option>
                  {savedLineups.map((lineup) => (
                    <option key={lineup.id} value={lineup.id}>
                      {lineup.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={17} aria-hidden="true" />
              </label>
              <button
                className="deleteButton"
                disabled={!selectedSavedId}
                onClick={deleteLineup}
                type="button"
                aria-label="Delete saved lineup"
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default App;
