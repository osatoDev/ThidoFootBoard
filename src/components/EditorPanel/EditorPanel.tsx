import { Plus, RefreshCcw, RotateCcw, Trash2, Users } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import type { EditorTab, Player, PositionCoordinate } from "../../types";
import styles from "./EditorPanel.module.css";

type EditorPanelProps = {
  addSubstitute: () => void;
  editorTab: EditorTab;
  libraryPanel: ReactNode;
  matchImportPanel: ReactNode;
  players: Player[];
  positionSet: PositionCoordinate[];
  removeSubstitute: (index: number) => void;
  resetAll: () => void;
  resetPositions: () => void;
  selectedPlayerIndex: number | null;
  setEditorTab: Dispatch<SetStateAction<EditorTab>>;
  setSelectedPlayerIndex: Dispatch<SetStateAction<number | null>>;
  substitutes: Player[];
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
  matchImportPanel,
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
}: EditorPanelProps) {
  return (
    <aside className={styles.editorPanel}>
      <div className={styles.tabs} role="tablist" aria-label="Lineup editor">
        <button
          aria-selected={editorTab === "starting"}
          className={editorTab === "starting" ? styles.active : ""}
          onClick={() => setEditorTab("starting")}
          role="tab"
          type="button"
        >
          Starting XI
        </button>
        <button
          aria-selected={editorTab === "substitutes"}
          className={editorTab === "substitutes" ? styles.active : ""}
          onClick={() => setEditorTab("substitutes")}
          role="tab"
          type="button"
        >
          Substitutes
        </button>
      </div>

      {editorTab === "starting" ? (
        <div className={styles.playerRows}>
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
        <div className={styles.playerRows}>
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
        </div>
      )}

      <div className={styles.panelActions}>
        <button className={styles.textButton} onClick={addSubstitute} type="button">
          <Plus size={18} aria-hidden="true" />
          Add Player
        </button>
        <button className={styles.textButton} onClick={resetAll} type="button">
          <RefreshCcw size={18} aria-hidden="true" />
          Reset All
        </button>
        <button className={styles.textButton} onClick={resetPositions} type="button">
          <RotateCcw size={18} aria-hidden="true" />
          Reset Positions
        </button>
      </div>

      {matchImportPanel}
      {libraryPanel}
    </aside>
  );
}
