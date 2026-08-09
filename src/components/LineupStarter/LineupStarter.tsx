import { Search, Sparkles } from "lucide-react";
import styles from "./LineupStarter.module.css";

type LineupStarterProps = {
  onOpenImport: () => void;
  onStartBlank: () => void;
};

export function LineupStarter({ onOpenImport, onStartBlank }: LineupStarterProps) {
  return (
    <section className={styles.starter} aria-labelledby="lineup-starter-title">
      <div className={styles.iconWrap}><Sparkles size={20} aria-hidden="true" /></div>
      <span>New lineup</span>
      <h2 id="lineup-starter-title">How would you like to start?</h2>
      <p>Import an existing lineup or build one from the formation.</p>
      <div className={styles.actions}>
        <button className={styles.primaryButton} onClick={onOpenImport} type="button">
          <Search size={17} aria-hidden="true" /> Import lineup
        </button>
        <button onClick={onStartBlank} type="button">Start blank</button>
      </div>
    </section>
  );
}
