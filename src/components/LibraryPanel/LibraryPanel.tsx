import { ChevronDown, FolderOpen, Save, Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import type { SavedLineup } from "../../types";
import styles from "./LibraryPanel.module.css";

type LibraryPanelProps = {
  lineupName: string;
  onDeleteLineup: () => void;
  onLoadLineup: (id: string) => void;
  onSaveLineup: () => void;
  savedLineups: SavedLineup[];
  selectedSavedId: string;
  setLineupName: Dispatch<SetStateAction<string>>;
};

export function LibraryPanel({
  lineupName,
  onDeleteLineup,
  onLoadLineup,
  onSaveLineup,
  savedLineups,
  selectedSavedId,
  setLineupName,
}: LibraryPanelProps) {
  return (
    <div className={styles.libraryPanel}>
      <div className={styles.libraryHeader}>
        <FolderOpen size={18} aria-hidden="true" />
        <span>Lineups</span>
      </div>
      <div className={styles.saveGrid}>
        <input
          aria-label="Lineup name"
          onChange={(event) => setLineupName(event.target.value)}
          placeholder="Lineup name"
          type="text"
          value={lineupName}
        />
        <button className={styles.saveButton} onClick={onSaveLineup} type="button" aria-label="Save lineup">
          <Save size={18} aria-hidden="true" />
        </button>
      </div>
      <div className={styles.saveGrid}>
        <label className={`${styles.selectWrap} ${styles.librarySelect}`}>
          <select aria-label="Saved lineups" onChange={(event) => onLoadLineup(event.target.value)} value={selectedSavedId}>
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
          className={styles.deleteButton}
          disabled={!selectedSavedId}
          onClick={onDeleteLineup}
          type="button"
          aria-label="Delete saved lineup"
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
