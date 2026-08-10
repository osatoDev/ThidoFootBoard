import { ArrowUpRight, ChevronDown, Copy, FolderOpen, Save, Trash2 } from "lucide-react";
import { type Dispatch, type KeyboardEvent, type SetStateAction, useEffect, useState } from "react";

import type { SavedLineup } from "../../types";
import { trackFeature } from "../../pendo";
import styles from "./LibraryPanel.module.css";

type LibraryPanelProps = {
  lineupName: string;
  onDeleteLineup: (id: string) => void;
  onDuplicateLineup: (id: string) => void;
  onLoadLineup: (id: string) => void;
  onRenameLineup: (id: string, name: string) => void;
  onSaveLineup: () => void;
  savedLineups: SavedLineup[];
  selectedSavedId: string;
  saveState: string;
  setLineupName: Dispatch<SetStateAction<string>>;
};

export function LibraryPanel({
  lineupName,
  onDeleteLineup,
  onDuplicateLineup,
  onLoadLineup,
  onRenameLineup,
  onSaveLineup,
  savedLineups,
  selectedSavedId,
  saveState,
  setLineupName,
}: LibraryPanelProps) {
  return (
    <details
      className={styles.libraryPanel}
      onToggle={(event) => {
        if (event.currentTarget.open) {
          trackFeature("saved_lineup_library_opened", {
            saved_count: savedLineups.length,
          });
        }
      }}
    >
      <summary className={styles.libraryHeader}>
        <div>
          <FolderOpen size={18} aria-hidden="true" />
          <span>Saved lineups</span>
          <b>{savedLineups.length}</b>
        </div>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      <div className={styles.libraryBody}>
        <div className={styles.saveGrid}>
          <input
            aria-label="Lineup name"
            onChange={(event) => setLineupName(event.target.value)}
            placeholder="Lineup name"
            type="text"
            value={lineupName}
          />
          <button className={styles.saveButton} onClick={onSaveLineup} type="button">
            <Save size={18} aria-hidden="true" />
            {selectedSavedId ? "Update" : "Save"}
          </button>
        </div>
        {saveState ? <p className={styles.saveStatus}>{saveState}</p> : null}
        <div className={styles.lineupList} aria-label="Saved lineup library">
          {savedLineups.length === 0 ? (
            <p className={styles.emptyState}>Saved lineups will appear here for quick access.</p>
          ) : (
            savedLineups.slice(0, 6).map((lineup) => (
              <LineupCard
                isSelected={selectedSavedId === lineup.id}
                key={lineup.id}
                lineup={lineup}
                onDelete={onDeleteLineup}
                onDuplicate={onDuplicateLineup}
                onOpen={onLoadLineup}
                onRename={onRenameLineup}
              />
            ))
          )}
        </div>
      </div>
    </details>
  );
}

type LineupCardProps = {
  isSelected: boolean;
  lineup: SavedLineup;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onOpen: (id: string) => void;
  onRename: (id: string, name: string) => void;
};

function LineupCard({ isSelected, lineup, onDelete, onDuplicate, onOpen, onRename }: LineupCardProps) {
  const [draftName, setDraftName] = useState(lineup.name);

  useEffect(() => setDraftName(lineup.name), [lineup.name]);

  function commitName() {
    if (draftName.trim() && draftName.trim() !== lineup.name) {
      onRename(lineup.id, draftName);
    } else {
      setDraftName(lineup.name);
    }
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  }

  return (
    <article className={`${styles.lineupCard} ${isSelected ? styles.selected : ""}`}>
      <div className={styles.lineupCopy}>
        <input
          aria-label={`Rename ${lineup.name}`}
          onBlur={commitName}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={handleNameKeyDown}
          value={draftName}
        />
        <span>{lineup.formation} · {new Date(lineup.updatedAt ?? lineup.createdAt).toLocaleDateString()}</span>
      </div>
      <div className={styles.cardActions}>
        <button aria-label={`Open ${lineup.name}`} onClick={() => onOpen(lineup.id)} type="button">
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
        <button aria-label={`Duplicate ${lineup.name}`} onClick={() => onDuplicate(lineup.id)} type="button">
          <Copy size={15} aria-hidden="true" />
        </button>
        <button aria-label={`Delete ${lineup.name}`} className={styles.deleteButton} onClick={() => onDelete(lineup.id)} type="button">
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
