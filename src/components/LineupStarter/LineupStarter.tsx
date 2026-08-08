import { ClipboardPaste, FileJson, Search, Sparkles } from "lucide-react";

import type { LineupImportMethod } from "../LineupImportModal/LineupImportModal";
import styles from "./LineupStarter.module.css";

type LineupStarterProps = {
  onOpenImport: (method: LineupImportMethod) => void;
  onStartBlank: () => void;
};

export function LineupStarter({ onOpenImport, onStartBlank }: LineupStarterProps) {
  return (
    <section className={styles.starter} aria-labelledby="lineup-starter-title">
      <div className={styles.iconWrap}><Sparkles size={20} aria-hidden="true" /></div>
      <span>Build your first lineup</span>
      <h2 id="lineup-starter-title">Bring in a real match or start from the formation</h2>
      <p>Import a confirmed XI in seconds, or use the neutral position markers as your blank canvas.</p>
      <div className={styles.actions}>
        <button className={styles.primaryButton} onClick={() => onOpenImport("match")} type="button">
          <Search size={17} aria-hidden="true" /> Import a match lineup
        </button>
        <button onClick={onStartBlank} type="button">Start blank</button>
      </div>
      <div className={styles.quickLinks}>
        <button onClick={() => onOpenImport("text")} type="button"><ClipboardPaste size={15} aria-hidden="true" /> Paste squad</button>
        <button onClick={() => onOpenImport("file")} type="button"><FileJson size={15} aria-hidden="true" /> Upload CSV / JSON</button>
      </div>
    </section>
  );
}
