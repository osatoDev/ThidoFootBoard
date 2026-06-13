import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";

import { normalizeArrows } from "../arrowUtils";
import { exportPitchImage } from "../exportPitchImage";
import { formations } from "../formations";
import { fetchMatchLineups, fetchMatchResults } from "../matchApi";
import {
  clamp,
  createEmptyPlayers,
  DEFAULT_FORMATION,
  isFormationName,
  mapGridToPitchPlayers,
  normalizePlayers,
  stripCustomPositions,
  teamNameMatches,
  todayInputValue,
} from "../playerUtils";
import { createId, CURRENT_STORAGE_KEY, loadCurrentLineup, loadSavedLineups, SAVED_STORAGE_KEY } from "../storage";
import type {
  ArrowStyle,
  CurrentLineup,
  EditorTab,
  FormationName,
  MatchLoadSide,
  MatchSummary,
  MovementArrow,
  Player,
  SavedLineup,
} from "../types";

const arrowColors = ["#f97316", "#38bdf8", "#facc15", "#ffffff"];

export function useLineupBuilder() {
  const initialLineup = useMemo(loadCurrentLineup, []);
  const [formation, setFormation] = useState<FormationName>(initialLineup.formation);
  const [players, setPlayers] = useState<Player[]>(initialLineup.players);
  const [substitutes, setSubstitutes] = useState<Player[]>(initialLineup.substitutes);
  const [arrows, setArrows] = useState<MovementArrow[]>(initialLineup.arrows);
  const [draftArrow, setDraftArrow] = useState<MovementArrow | null>(null);
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [isDrawingArrows, setIsDrawingArrows] = useState(false);
  const [arrowColor, setArrowColor] = useState(arrowColors[0]);
  const [arrowStyle, setArrowStyle] = useState<ArrowStyle>("solid");
  const [pitchTheme, setPitchTheme] = useState(initialLineup.pitchTheme);
  const [playerBadges, setPlayerBadges] = useState(initialLineup.playerBadges);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number | null>(null);
  const [draggingPlayerIndex, setDraggingPlayerIndex] = useState<number | null>(null);
  const [editorTab, setEditorTab] = useState<EditorTab>("starting");
  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>(loadSavedLineups);
  const [lineupName, setLineupName] = useState("");
  const [selectedSavedId, setSelectedSavedId] = useState("");
  const [matchDate, setMatchDate] = useState(todayInputValue);
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [matchResults, setMatchResults] = useState<MatchSummary[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [matchImportStatus, setMatchImportStatus] = useState("");
  const [isSearchingMatches, setIsSearchingMatches] = useState(false);
  const [isLoadingLineup, setIsLoadingLineup] = useState(false);
  const [matchLoadSide, setMatchLoadSide] = useState<MatchLoadSide>("teamA");
  const pitchRef = useRef<HTMLDivElement>(null);
  const draftArrowRef = useRef<MovementArrow | null>(null);

  const positionSet = formations[formation];

  useEffect(() => {
    const current: CurrentLineup = {
      formation,
      players,
      substitutes,
      arrows,
      pitchTheme,
      playerBadges,
    };
    window.localStorage.setItem(CURRENT_STORAGE_KEY, JSON.stringify(current));
  }, [formation, players, substitutes, arrows, pitchTheme, playerBadges]);

  useEffect(() => {
    window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedLineups));
  }, [savedLineups]);

  function updateFormation(nextFormation: FormationName) {
    setFormation(nextFormation);
    setPlayers((current) => stripCustomPositions(current));
    setSelectedPlayerIndex(null);
    setDraggingPlayerIndex(null);
  }

  function getPitchPoint(event: PointerEvent) {
    const pitch = pitchRef.current;
    if (!pitch) {
      return null;
    }

    const rect = pitch.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }

  function updatePlayer(index: number, field: "name" | "number", value: string) {
    setPlayers((current) =>
      current.map((player, playerIndex) => (playerIndex === index ? { ...player, [field]: value } : player)),
    );
  }

  function updateSubstitute(index: number, field: "name" | "number", value: string) {
    setSubstitutes((current) =>
      current.map((player, playerIndex) => (playerIndex === index ? { ...player, [field]: value } : player)),
    );
  }

  function setPlayerPosition(event: PointerEvent, index: number) {
    const point = getPitchPoint(event);
    if (!point) {
      return;
    }

    setPlayers((current) =>
      current.map((player, playerIndex) =>
        playerIndex === index
          ? {
              ...player,
              customX: Number(clamp(point.x, 4, 96).toFixed(2)),
              customY: Number(clamp(point.y, 5, 95).toFixed(2)),
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
    if (draggingPlayerIndex === index) {
      setPlayerPosition(event, index);
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>, index: number) {
    if (draggingPlayerIndex !== index) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    setDraggingPlayerIndex(null);
  }

  function handleArrowPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!isDrawingArrows) {
      return;
    }

    const point = getPitchPoint(event);
    if (!point) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const nextArrow: MovementArrow = {
      id: createId(),
      fromX: Number(point.x.toFixed(2)),
      fromY: Number(point.y.toFixed(2)),
      toX: Number(point.x.toFixed(2)),
      toY: Number(point.y.toFixed(2)),
      color: arrowColor,
      style: arrowStyle,
    };
    setSelectedPlayerIndex(null);
    setSelectedArrowId(nextArrow.id);
    draftArrowRef.current = nextArrow;
    setDraftArrow(nextArrow);
  }

  function handleArrowPointerMove(event: PointerEvent<SVGSVGElement>) {
    const currentDraft = draftArrowRef.current;
    if (!currentDraft) {
      return;
    }

    const point = getPitchPoint(event);
    if (!point) {
      return;
    }

    const nextDraft = {
      ...currentDraft,
      toX: Number(point.x.toFixed(2)),
      toY: Number(point.y.toFixed(2)),
    };
    draftArrowRef.current = nextDraft;
    setDraftArrow(nextDraft);
  }

  function handleArrowPointerUp(event: PointerEvent<SVGSVGElement>) {
    const currentDraft = draftArrowRef.current;
    if (!currentDraft) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const distance = Math.hypot(currentDraft.toX - currentDraft.fromX, currentDraft.toY - currentDraft.fromY);
    if (distance >= 3) {
      setArrows((current) => [...current, currentDraft]);
      setSelectedArrowId(currentDraft.id);
    } else {
      setSelectedArrowId(null);
    }
    draftArrowRef.current = null;
    setDraftArrow(null);
  }

  function selectArrow(id: string) {
    setSelectedArrowId(id);
    setSelectedPlayerIndex(null);
  }

  function deleteSelectedArrow() {
    if (!selectedArrowId) {
      return;
    }

    setArrows((current) => current.filter((arrow) => arrow.id !== selectedArrowId));
    setSelectedArrowId(null);
  }

  function clearArrows() {
    setArrows([]);
    draftArrowRef.current = null;
    setDraftArrow(null);
    setSelectedArrowId(null);
  }

  function resetPositions() {
    setPlayers((current) => stripCustomPositions(current));
    setSelectedPlayerIndex(null);
    setDraggingPlayerIndex(null);
  }

  function clearLineup() {
    setFormation(DEFAULT_FORMATION);
    setPlayers(createEmptyPlayers());
    setSubstitutes([]);
    setArrows([]);
    draftArrowRef.current = null;
    setDraftArrow(null);
    setLineupName("Untitled lineup");
    setSelectedPlayerIndex(null);
    setSelectedArrowId(null);
    setSelectedSavedId("");
  }

  function resetAll() {
    setFormation(DEFAULT_FORMATION);
    setPlayers(createEmptyPlayers());
    setSubstitutes([]);
    setArrows([]);
    draftArrowRef.current = null;
    setDraftArrow(null);
    setPitchTheme("classic");
    setPlayerBadges(true);
    setLineupName("");
    setSelectedPlayerIndex(null);
    setSelectedArrowId(null);
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
      arrows,
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
    setArrows(normalizeArrows(save.arrows));
    draftArrowRef.current = null;
    setDraftArrow(null);
    setSelectedPlayerIndex(null);
    setSelectedArrowId(null);
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
    const imported = (await fetchMatchLineups(match.fixtureId)).find((lineup) => lineup.team.id === teamId);
    if (!imported || imported.startXI.length === 0) {
      throw new Error("Lineups are not available yet for that team.");
    }

    if (isFormationName(imported.formation)) {
      setFormation(imported.formation);
    }

    setPlayers(normalizePlayers(mapGridToPitchPlayers(imported.startXI)));
    setSubstitutes(imported.substitutes.map((player) => ({ name: player.name, number: player.number })));
    setLineupName(`${imported.team.name} ${imported.formation || match.league.name}`);
    setEditorTab("starting");
    setSelectedPlayerIndex(null);
    setDraggingPlayerIndex(null);
    setSelectedArrowId(null);
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
      const matches = await fetchMatchResults(matchDate, teamA, teamB);
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

  return {
    editorPanelProps: {
      addSubstitute,
      editorTab,
      players,
      positionSet,
      removeSubstitute,
      resetAll,
      resetPositions,
      selectedPlayerIndex,
      setEditorTab,
      setSelectedPlayerIndex,
      substitutes,
      updatePlayer,
      updateSubstitute,
    },
    libraryPanelProps: {
      lineupName,
      onDeleteLineup: deleteLineup,
      onLoadLineup: loadLineup,
      onSaveLineup: saveLineup,
      savedLineups,
      selectedSavedId,
      setLineupName,
    },
    matchImportPanelProps: {
      isLoadingLineup,
      isSearchingMatches,
      matchDate,
      matchImportStatus,
      matchLoadSide,
      matchResults,
      onFindAndLoadLineup: findAndLoadLineup,
      onLoadImportedLineup: loadImportedLineup,
      onSearchMatches: searchMatches,
      onSwapTeams: swapTeams,
      selectedMatchId,
      setMatchDate,
      setMatchLoadSide,
      setSelectedMatchId,
      setTeamA,
      setTeamB,
      teamA,
      teamB,
    },
    pitchPanelProps: {
      arrowColor,
      arrowColors,
      arrows,
      arrowStyle,
      clearArrows,
      deleteSelectedArrow,
      draftArrow,
      formation,
      isDrawingArrows,
      onArrowPointerDown: handleArrowPointerDown,
      onArrowPointerMove: handleArrowPointerMove,
      onArrowPointerUp: handleArrowPointerUp,
      onFormationChange: updateFormation,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      pitchRef,
      pitchTheme,
      playerBadges,
      players,
      positionSet,
      selectArrow,
      selectedArrowId,
      selectedPlayerIndex,
      setArrowColor,
      setArrowStyle,
      setIsDrawingArrows,
      setPitchTheme,
      setPlayerBadges,
      setSelectedPlayerIndex,
    },
    topBarProps: {
      formation,
      onClearLineup: clearLineup,
      onExportPitchImage: () => exportPitchImage({ arrows, lineupName, pitchTheme, players, positionSet }),
      onFormationChange: updateFormation,
    },
  };
}
