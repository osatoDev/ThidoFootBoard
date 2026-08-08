import { ClipboardPaste, Crown, FileJson, Image, Search } from "lucide-react";

import type { LineupImportMethod } from "../LineupImportModal/LineupImportModal";
import styles from "./MatchImportPanel.module.css";

type MatchImportPanelProps = {
  hasPremiumAccess: boolean;
  matchImportStatus: string;
  onOpenImport: (method: LineupImportMethod) => void;
  onOpenPricing: () => void;
};

export function MatchImportPanel({
  hasPremiumAccess,
  matchImportStatus,
  onOpenImport,
  onOpenPricing,
}: MatchImportPanelProps) {
  return (
    <section className={styles.matchImportPanel} aria-label="Lineup import">
      <div className={styles.matchImportHeader}>
        <div>
          <span>Lineup Import</span>
          <strong>Choose a source</strong>
        </div>
        <Search size={20} aria-hidden="true" />
      </div>

      <div className={styles.importGrid}>
        <button className={styles.primaryImport} onClick={() => onOpenImport("match")} type="button">
          <Search size={17} aria-hidden="true" />
          Find match
          {!hasPremiumAccess ? <Crown size={13} aria-label="Premium" /> : null}
        </button>
        <button onClick={() => onOpenImport("screenshot")} type="button">
          <Image size={17} aria-hidden="true" />
          Screenshot
        </button>
        <button onClick={() => onOpenImport("text")} type="button">
          <ClipboardPaste size={17} aria-hidden="true" />
          Paste squad
        </button>
        <button onClick={() => onOpenImport("file")} type="button">
          <FileJson size={17} aria-hidden="true" />
          CSV / JSON
        </button>
      </div>

      {!hasPremiumAccess ? (
        <button className={styles.premiumNotice} onClick={onOpenPricing} type="button">
          <Crown size={16} aria-hidden="true" />
          AI screenshot and match imports are available with Premium
        </button>
      ) : null}

      {matchImportStatus ? <p className={styles.matchImportStatus}>{matchImportStatus}</p> : null}

    </section>
  );
}
