import { MoreHorizontal, Plus, RotateCcw, Sparkles, Trash2, Upload, Users } from "lucide-react";
import { type Dispatch, type KeyboardEvent, type ReactNode, type SetStateAction, useRef } from "react";

import type { EditorTab, Player, PositionCoordinate } from "../../types";
import { trackFeature } from "../../pendo";
import styles from "./EditorPanel.module.css";

type EditorPanelProps = {
  addSubstitute: () => void;
  editorTab: EditorTab;
  libraryPanel: ReactNode;
  players: Player[];
  positionSet: PositionCoordinate[];
  removeSubstitute: (index: number) => void;
  resetAppearance: () => void;
  resetPositions: () => void;
  selectedPlayerIndex: number | null;
  setEditorTab: Dispatch<SetStateAction<EditorTab>>;
  setSelectedPlayerIndex: Dispatch<SetStateAction<number | null>>;
  substitutes: Player[];
  onOpenImport: () => void;
  updatePlayer: (index: number, field: "name" | "number", value: string) => void;
  updateSubstitute: (index: number, field: "name" | "number", value: string) => void;
};

function cx(...classes: Array<string | false>) {
  return classes.filter(Boolean).join(" ");
}

export function EditorPanel({
  addSubstitute,
  editorTab,
  libraryPanel,
  players,
  positionSet,
  removeSubstitute,
  resetAppearance,
  resetPositions,
  selectedPlayerIndex,
  setEditorTab,
  setSelectedPlayerIndex,
  substitutes,
  onOpenImport,
  updatePlayer,
  updateSubstitute,
}: EditorPanelProps) {
  const playerNameRefs = useRef<Array<HTMLInputElement | null>>([]);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handlePlayerKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    playerNameRefs.current[index + 1]?.focus();
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, tab: EditorTab) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }
    event.preventDefault();
    const nextTab: EditorTab = tab === "starting" ? "substitutes" : "starting";
    setEditorTab(nextTab);
    trackFeature("editor_tab_changed", { tab: nextTab });
    tabRefs.current[nextTab === "starting" ? 0 : 1]?.focus();
  }

  return (
    <aside className={styles.editorPanel}>
      <div className={styles.panelHeader}>
        <div>
          <span>Editor</span>
          <h2>Lineup</h2>
        </div>
        <button className={styles.importButton} onClick={onOpenImport} type="button">
          <Upload size={17} aria-hidden="true" />
          Import
        </button>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Lineup editor">
        <button
          aria-controls="starting-lineup-panel"
          aria-selected={editorTab === "starting"}
          className={editorTab === "starting" ? styles.active : ""}
          id="starting-lineup-tab"
          onKeyDown={(event) => handleTabKeyDown(event, "starting")}
          onClick={() => {
            setEditorTab("starting");
            if (editorTab !== "starting") {
              trackFeature("editor_tab_changed", { tab: "starting" });
            }
          }}
          ref={(element) => { tabRefs.current[0] = element; }}
          role="tab"
          tabIndex={editorTab === "starting" ? 0 : -1}
          type="button"
        >
          Starting XI <span>{players.filter((player) => player.name.trim()).length}/11</span>
        </button>
        <button
          aria-controls="substitutes-lineup-panel"
          aria-selected={editorTab === "substitutes"}
          className={editorTab === "substitutes" ? styles.active : ""}
          id="substitutes-lineup-tab"
          onKeyDown={(event) => handleTabKeyDown(event, "substitutes")}
          onClick={() => {
            setEditorTab("substitutes");
            if (editorTab !== "substitutes") {
              trackFeature("editor_tab_changed", { tab: "substitutes" });
            }
          }}
          ref={(element) => { tabRefs.current[1] = element; }}
          role="tab"
          tabIndex={editorTab === "substitutes" ? 0 : -1}
          type="button"
        >
          Substitutes <span>{substitutes.length}</span>
        </button>
      </div>

      {editorTab === "starting" ? (
        <div aria-labelledby="starting-lineup-tab" className={styles.playerRows} id="starting-lineup-panel" role="tabpanel">
          {players.map((player, index) => {
            const role = positionSet[index].role;
            const isSelected = selectedPlayerIndex === index;

            return (
              <div className={cx(styles.playerRow, isSelected && styles.selected)} key={`row-${index}`}>
                <button
                  className={styles.rowBadge}
                  onClick={() => setSelectedPlayerIndex(index)}
                  type="button"
                  aria-label={`Select player ${index + 1}`}
                >
                  {player.number || role}
                </button>
                <input
                  aria-label={`${role} player name`}
                  onKeyDown={(event) => handlePlayerKeyDown(event, index)}
                  onChange={(event) => updatePlayer(index, "name", event.target.value)}
                  placeholder="Player name"
                  ref={(element) => { playerNameRefs.current[index] = element; }}
                  type="text"
                  value={player.name}
                />
                <input
                  aria-label={`${role} shirt number`}
                  className={styles.numberInput}
                  inputMode="numeric"
                  onChange={(event) => updatePlayer(index, "number", event.target.value)}
                  placeholder="#"
                  type="text"
                  value={player.number}
                />
                <span className={styles.roleLabel}>{role}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div aria-labelledby="substitutes-lineup-tab" className={styles.playerRows} id="substitutes-lineup-panel" role="tabpanel">
          {substitutes.map((player, index) => (
            <div className={cx(styles.playerRow, styles.substituteRow)} key={`sub-${index}`}>
              <div className={styles.rowBadge}>
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
                className={styles.numberInput}
                inputMode="numeric"
                onChange={(event) => updateSubstitute(index, "number", event.target.value)}
                placeholder="#"
                type="text"
                value={player.number}
              />
              <button
                className={styles.iconButton}
                onClick={() => removeSubstitute(index)}
                type="button"
                aria-label="Remove substitute"
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </div>
          ))}
          {substitutes.length === 0 ? <p className={styles.emptyState}>No substitutes</p> : null}
          <button className={styles.addSubstituteButton} onClick={addSubstitute} type="button">
            <Plus size={17} aria-hidden="true" />
            Add substitute
          </button>
        </div>
      )}

      <details className={styles.secondaryTools}>
        <summary>
          <MoreHorizontal size={18} aria-hidden="true" />
          More tools
        </summary>
        <div>
          <button className={styles.textButton} onClick={resetAppearance} type="button">
            <Sparkles size={17} aria-hidden="true" />
            Reset appearance
          </button>
          <button className={styles.textButton} onClick={resetPositions} type="button">
            <RotateCcw size={17} aria-hidden="true" />
            Restore positions
          </button>
        </div>
      </details>

      {libraryPanel}
    </aside>
  );
}
