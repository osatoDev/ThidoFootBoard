import { CircleHelp, Crown, Download, RefreshCcw, Sparkles } from "lucide-react";

import styles from "./TopBar.module.css";

type TopBarProps = {
  canExport: boolean;
  hasPremiumAccess: boolean;
  isLocalhost: boolean;
  onClearLineup: () => void;
  onExportPitchImage: () => void;
  onOpenHowItWorks: () => void;
  onOpenMatchImport: () => void;
  onOpenPricing: () => void;
};

export function TopBar({
  canExport,
  hasPremiumAccess,
  isLocalhost,
  onClearLineup,
  onExportPitchImage,
  onOpenHowItWorks,
  onOpenMatchImport,
  onOpenPricing,
}: TopBarProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.brandLockup}>
        <div className={styles.brandMark} aria-hidden="true">
          <span>T</span>
        </div>
        <div className={styles.brandCopy}>
          <div className={styles.brandMeta}>
            <p className={styles.eyebrow}>Thido</p>
            <button className={styles.howItWorksButton} onClick={onOpenHowItWorks} type="button">
              <CircleHelp size={14} aria-hidden="true" />
              How it works
            </button>
          </div>
          <h1 className={styles.heading}>Lineup Builder</h1>
        </div>
      </div>

      <div className={styles.topActions}>
        <button className={styles.importButton} onClick={onOpenMatchImport} type="button">
          <Sparkles size={17} aria-hidden="true" />
          Import match
        </button>
        <button className={styles.planButton} onClick={onOpenPricing} type="button">
          <Crown size={17} aria-hidden="true" />
          {hasPremiumAccess ? (isLocalhost ? "Premium Dev" : "Premium") : "Upgrade"}
        </button>
        <button className={styles.ghostButton} onClick={onClearLineup} type="button">
          <RefreshCcw size={18} aria-hidden="true" />
          Clear lineup
        </button>
        <button
          className={styles.primaryButton}
          disabled={!canExport}
          onClick={onExportPitchImage}
          title={canExport ? "Export the current pitch as an image" : "Add or import players before exporting"}
          type="button"
        >
          <Download size={18} aria-hidden="true" />
          Export Image
        </button>
      </div>
    </header>
  );
}
