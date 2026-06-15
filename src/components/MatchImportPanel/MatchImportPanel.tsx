import { ChevronDown, Crown, Download } from "lucide-react";
import { useState } from "react";

import type { ManualLineupImport } from "../../types";
import {
  LineupImportModal,
  type LineupImportMethod,
} from "../LineupImportModal/LineupImportModal";
import styles from "./MatchImportPanel.module.css";

type MatchImportPanelProps = {
  hasPremiumAccess: boolean;
  matchImportStatus: string;
  onImportLineup: (lineup: ManualLineupImport) => void;
  onOpenPricing: () => void;
};

export function MatchImportPanel({
  hasPremiumAccess,
  matchImportStatus,
  onImportLineup,
  onOpenPricing,
}: MatchImportPanelProps) {
  const [importMethod, setImportMethod] = useState<LineupImportMethod | null>(null);

  function openImportMethod(value: string) {
    if (!value) {
      return;
    }

    if ((value === "screenshot" || value === "match") && !hasPremiumAccess) {
      onOpenPricing();
      return;
    }

    setImportMethod(value as LineupImportMethod);
  }

  return (
    <section className={styles.matchImportPanel} aria-label="Lineup import">
      <div className={styles.matchImportHeader}>
        <div>
          <span>Lineup Import</span>
          <strong>Choose a source</strong>
        </div>
        <Download size={20} aria-hidden="true" />
      </div>

      <label className={`${styles.selectWrap} ${styles.importMethodSelect}`}>
        <Download size={17} aria-hidden="true" />
        <select aria-label="Import lineup" onChange={(event) => openImportMethod(event.target.value)} value="">
          <option value="">Import lineup</option>
          <option value="screenshot">Upload screenshot (Premium)</option>
          <option value="match">Find match lineup with AI (Premium)</option>
          <option value="file">Import CSV or JSON</option>
          <option value="text">Paste text</option>
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </label>

      {!hasPremiumAccess ? (
        <button className={styles.premiumNotice} onClick={onOpenPricing} type="button">
          <Crown size={16} aria-hidden="true" />
          AI screenshot and match imports are available with Premium
        </button>
      ) : null}

      {matchImportStatus ? <p className={styles.matchImportStatus}>{matchImportStatus}</p> : null}

      {importMethod ? (
        <LineupImportModal
          method={importMethod}
          onClose={() => setImportMethod(null)}
          onImportLineup={onImportLineup}
        />
      ) : null}
    </section>
  );
}
