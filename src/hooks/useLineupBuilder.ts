import { MouseEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";

import { normalizeArrows } from "../arrowUtils";
import { exportPitchImage } from "../exportPitchImage";
import { formations } from "../formations";
import {
  clamp,
  createEmptyPlayers,
  DEFAULT_FORMATION,
  hasPlayerDetails,
  normalizePlayers,
  stripCustomPositions,
} from "../playerUtils";
import { trackFeature, trackProductEvent } from "../pendo";
import { createId, CURRENT_STORAGE_KEY, loadCurrentLineup, loadSavedLineups, SAVED_STORAGE_KEY } from "../storage";
import type {
  ArrowStyle,
  CurrentLineup,
  EditorTab,
  FormationName,
  ManualLineupImport,
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
  const [arrowStartPlayerIndex, setArrowStartPlayerIndex] = useState<number | null>(null);
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
  const [matchImportStatus, setMatchImportStatus] = useState("");
  const pitchRef = useRef<HTMLDivElement>(null);
  const draftArrowRef = useRef<MovementArrow | null>(null);
  const arrowStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const trackedEditsRef = useRef(new Set<string>());

  const positionSet = formations[formation];

  useEffect(() => {
    if (!isDrawingArrows) {
      arrowStartPointRef.current = null;
      draftArrowRef.current = null;
      setArrowStartPlayerIndex(null);
      setDraftArrow(null);
    }
  }, [isDrawingArrows]);

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

  useEffect(() => {
    if (!matchImportStatus) {
      return;
    }
    const timeoutId = window.setTimeout(() => setMatchImportStatus(""), 4200);
    return () => window.clearTimeout(timeoutId);
  }, [matchImportStatus]);

  function updateFormation(nextFormation: FormationName) {
    if (nextFormation !== formation) {
      trackFeature("formation_changed", { formation: nextFormation });
    }
    setFormation(nextFormation);
    setPlayers((current) => stripCustomPositions(current));
    setSelectedPlayerIndex(null);
    setDraggingPlayerIndex(null);
  }

  function getPitchPoint(event: MouseEvent | PointerEvent) {
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

  function getPlayerPitchPoint(index: number) {
    const player = players[index];
    const position = positionSet[index];

    if (!player || !position) {
      return null;
    }

    return {
      x: Number((player.customX ?? position.x).toFixed(2)),
      y: Number((player.customY ?? position.y).toFixed(2)),
    };
  }

  function updatePlayer(index: number, field: "name" | "number", value: string) {
    if (value.trim() && !trackedEditsRef.current.has("starting_lineup_edited")) {
      trackedEditsRef.current.add("starting_lineup_edited");
      trackFeature("starting_lineup_edited", { field });
    }
    setMatchImportStatus("");
    setPlayers((current) =>
      current.map((player, playerIndex) => (playerIndex === index ? { ...player, [field]: value } : player)),
    );
  }

  function updateSubstitute(index: number, field: "name" | "number", value: string) {
    if (value.trim() && !trackedEditsRef.current.has("substitutes_edited")) {
      trackedEditsRef.current.add("substitutes_edited");
      trackFeature("substitutes_edited", { field });
    }
    setMatchImportStatus("");
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
    if (isDrawingArrows) {
      return;
    }

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
    trackFeature("player_repositioned", { formation });
  }

  function handleArrowPointerDown(event: PointerEvent<SVGElement>) {
    if (!isDrawingArrows) {
      return;
    }

    const point = getPitchPoint(event);
    if (!point) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startPoint = arrowStartPointRef.current ?? point;
    const nextArrow: MovementArrow = {
      id: createId(),
      fromX: Number(startPoint.x.toFixed(2)),
      fromY: Number(startPoint.y.toFixed(2)),
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

  function handleArrowMouseDown(event: MouseEvent<SVGElement>) {
    if (!isDrawingArrows || draftArrowRef.current) {
      return;
    }

    const point = getPitchPoint(event);
    if (!point) {
      return;
    }

    const startPoint = arrowStartPointRef.current ?? point;
    const nextArrow: MovementArrow = {
      id: createId(),
      fromX: Number(startPoint.x.toFixed(2)),
      fromY: Number(startPoint.y.toFixed(2)),
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

  function handleArrowPointerMove(event: PointerEvent<SVGElement>) {
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

  function handleArrowMouseMove(event: MouseEvent<SVGElement>) {
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

  function handleArrowPointerUp(event: PointerEvent<SVGElement>) {
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
      trackFeature("movement_arrow_created", {
        input: arrowStartPointRef.current ? "player" : "pointer",
        style: currentDraft.style,
      });
    } else {
      setSelectedArrowId(null);
    }
    draftArrowRef.current = null;
    arrowStartPointRef.current = null;
    setArrowStartPlayerIndex(null);
    setDraftArrow(null);
  }

  function handleArrowMouseUp() {
    const currentDraft = draftArrowRef.current;
    if (!currentDraft) {
      return;
    }

    const distance = Math.hypot(currentDraft.toX - currentDraft.fromX, currentDraft.toY - currentDraft.fromY);
    if (distance >= 3) {
      setArrows((current) => [...current, currentDraft]);
      setSelectedArrowId(currentDraft.id);
      trackFeature("movement_arrow_created", {
        input: arrowStartPointRef.current ? "player" : "mouse",
        style: currentDraft.style,
      });
    } else {
      setSelectedArrowId(null);
    }
    draftArrowRef.current = null;
    arrowStartPointRef.current = null;
    setArrowStartPlayerIndex(null);
    setDraftArrow(null);
  }


  function handleArrowClick(event: MouseEvent<SVGElement>) {
    if (!isDrawingArrows || !arrowStartPointRef.current) {
      return;
    }

    const point = getPitchPoint(event);
    if (!point) {
      return;
    }

    const startPoint = arrowStartPointRef.current;
    const nextArrow: MovementArrow = {
      id: createId(),
      fromX: Number(startPoint.x.toFixed(2)),
      fromY: Number(startPoint.y.toFixed(2)),
      toX: Number(point.x.toFixed(2)),
      toY: Number(point.y.toFixed(2)),
      color: arrowColor,
      style: arrowStyle,
    };
    const distance = Math.hypot(nextArrow.toX - nextArrow.fromX, nextArrow.toY - nextArrow.fromY);
    if (distance >= 3) {
      setArrows((current) => [...current, nextArrow]);
      setSelectedArrowId(nextArrow.id);
      trackFeature("movement_arrow_created", {
        input: "player_click",
        style: nextArrow.style,
      });
    }
    arrowStartPointRef.current = null;
    draftArrowRef.current = null;
    setDraftArrow(null);
    setArrowStartPlayerIndex(null);
  }

  function startArrowFromPlayer(index: number) {
    if (!isDrawingArrows) {
      return;
    }

    const point = getPlayerPitchPoint(index);
    if (!point) {
      return;
    }

    arrowStartPointRef.current = point;
    setArrowStartPlayerIndex(index);
    setSelectedArrowId(null);
    setSelectedPlayerIndex(index);
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
    trackFeature("movement_arrow_deleted");
  }

  function clearArrows() {
    if (arrows.length > 0) {
      trackFeature("movement_arrows_cleared", { count: arrows.length });
    }
    setArrows([]);
    draftArrowRef.current = null;
    arrowStartPointRef.current = null;
    setDraftArrow(null);
    setArrowStartPlayerIndex(null);
    setSelectedArrowId(null);
  }

  function resetPositions() {
    setPlayers((current) => stripCustomPositions(current));
    setSelectedPlayerIndex(null);
    setDraggingPlayerIndex(null);
    setMatchImportStatus("Formation positions restored.");
    trackFeature("player_positions_reset");
  }

  function clearLineup() {
    setFormation(DEFAULT_FORMATION);
    setPlayers(createEmptyPlayers());
    setSubstitutes([]);
    setArrows([]);
    draftArrowRef.current = null;
    arrowStartPointRef.current = null;
    setDraftArrow(null);
    setArrowStartPlayerIndex(null);
    setLineupName("Untitled lineup");
    setSelectedPlayerIndex(null);
    setSelectedArrowId(null);
    setSelectedSavedId("");
    setMatchImportStatus("Current lineup cleared. Saved library lineups are unchanged.");
    trackFeature("lineup_cleared");
  }

  function resetAppearance() {
    setPitchTheme("classic");
    setPlayerBadges(true);
    setMatchImportStatus("Pitch appearance restored.");
    trackFeature("pitch_appearance_reset");
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
      createdAt: savedLineups.find((lineup) => lineup.id === selectedSavedId)?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    setSavedLineups((current) => {
      const withoutExisting = current.filter((lineup) => lineup.id !== save.id);
      return [save, ...withoutExisting].slice(0, 20);
    });
    setSelectedSavedId(save.id);
    setLineupName(name);
    setMatchImportStatus("Saved to your lineup library.");
    trackFeature("lineup_saved", {
      operation: selectedSavedId ? "update" : "create",
      saved_count: Math.min(savedLineups.length + (selectedSavedId ? 0 : 1), 20),
    });
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
    arrowStartPointRef.current = null;
    setDraftArrow(null);
    setArrowStartPlayerIndex(null);
    setSelectedPlayerIndex(null);
    setSelectedArrowId(null);
    setMatchImportStatus(`Opened ${save.name}.`);
    trackFeature("saved_lineup_opened", { formation: save.formation });
  }

  function deleteLineup(id: string) {
    const deleted = savedLineups.find((lineup) => lineup.id === id);
    setSavedLineups((current) => current.filter((lineup) => lineup.id !== id));
    if (selectedSavedId === id) {
      setSelectedSavedId("");
    }
    if (deleted) {
      setMatchImportStatus(`Deleted ${deleted.name}.`);
      trackFeature("saved_lineup_deleted");
    }
  }

  function duplicateLineup(id: string) {
    const source = savedLineups.find((lineup) => lineup.id === id);
    if (!source) {
      return;
    }

    const duplicate: SavedLineup = {
      ...source,
      id: createId(),
      name: `${source.name} copy`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSavedLineups((current) => [duplicate, ...current].slice(0, 20));
    setMatchImportStatus(`Duplicated ${source.name}.`);
    trackFeature("saved_lineup_duplicated");
  }

  function renameLineup(id: string, name: string) {
    const cleanName = name.trim();
    if (!cleanName) {
      return;
    }

    setSavedLineups((current) =>
      current.map((lineup) =>
        lineup.id === id ? { ...lineup, name: cleanName, updatedAt: Date.now() } : lineup,
      ),
    );
    if (selectedSavedId === id) {
      setLineupName(cleanName);
    }
    setMatchImportStatus(`Renamed lineup to ${cleanName}.`);
    trackFeature("saved_lineup_renamed");
  }

  function addSubstitute() {
    setSubstitutes((current) => [...current, { name: "", number: "" }]);
    setEditorTab("substitutes");
    trackFeature("substitute_added", { next_count: substitutes.length + 1 });
  }

  function removeSubstitute(index: number) {
    setSubstitutes((current) => current.filter((_, playerIndex) => playerIndex !== index));
    trackFeature("substitute_removed", { next_count: Math.max(0, substitutes.length - 1) });
  }

  function importManualLineup(imported: ManualLineupImport) {
    if (imported.formation) {
      setFormation(imported.formation);
    }
    setPlayers(normalizePlayers(imported.players));
    setSubstitutes(imported.substitutes);
    setLineupName(imported.name?.trim() || "Imported lineup");
    setEditorTab("starting");
    setSelectedPlayerIndex(null);
    setDraggingPlayerIndex(null);
    setMatchImportStatus(
      `Imported ${Math.min(imported.players.length, 11)} starters and ${imported.substitutes.length} substitutes.`,
    );
    trackFeature("lineup_import_applied", {
      has_formation: Boolean(imported.formation),
      starters: Math.min(imported.players.length, 11),
      substitutes: imported.substitutes.length,
    });
  }

  function exportLineup() {
    const startedAt = performance.now();
    try {
      exportPitchImage({ arrows, lineupName, pitchTheme, players, positionSet });
      trackFeature("pitch_image_exported", {
        arrows: arrows.length,
        formation,
        theme: pitchTheme,
      });
      trackProductEvent("pitch_export_completed", {
        duration_ms: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      trackProductEvent("pitch_export_failed", {
        error_type: error instanceof Error ? error.name : "unknown",
      });
      throw error;
    }
  }

  const hasLineupContent =
    players.some(hasPlayerDetails) || substitutes.some(hasPlayerDetails) || arrows.length > 0;
  const selectedSavedLineup = savedLineups.find((lineup) => lineup.id === selectedSavedId);
  const selectedFingerprint = selectedSavedLineup
    ? JSON.stringify({
        arrows: normalizeArrows(selectedSavedLineup.arrows),
        formation: selectedSavedLineup.formation,
        players: selectedSavedLineup.players,
        substitutes: selectedSavedLineup.substitutes,
      })
    : "";
  const currentFingerprint = JSON.stringify({ arrows, formation, players, substitutes });
  const saveState = selectedSavedLineup
    ? selectedFingerprint === currentFingerprint
      ? "Saved to library"
      : "Unsaved library changes"
    : hasLineupContent
      ? "Autosaved locally"
      : "Blank lineup";

  return {
    editorPanelProps: {
      addSubstitute,
      editorTab,
      players,
      positionSet,
      removeSubstitute,
      resetAppearance,
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
      onDuplicateLineup: duplicateLineup,
      onLoadLineup: loadLineup,
      onRenameLineup: renameLineup,
      onSaveLineup: saveLineup,
      savedLineups,
      selectedSavedId,
      saveState,
      setLineupName,
    },
    pitchPanelProps: {
      arrowColor,
      arrowColors,
      arrowStartPlayerIndex,
      arrows,
      arrowStyle,
      clearArrows,
      deleteSelectedArrow,
      draftArrow,
      formation,
      isDrawingArrows,
      onArrowClick: handleArrowClick,
      onArrowMouseDown: handleArrowMouseDown,
      onArrowMouseMove: handleArrowMouseMove,
      onArrowMouseUp: handleArrowMouseUp,
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
      startArrowFromPlayer,
    },
    topBarProps: {
      canExport: hasLineupContent,
      onClearLineup: clearLineup,
      onExportPitchImage: exportLineup,
    },
    hasLineupContent,
    importManualLineup,
    saveState,
    workspaceStatus: matchImportStatus,
  };
}
