import { ChevronDown, Crown, Download, RefreshCcw } from "lucide-react";

import { moreFormations, quickFormations } from "../../formations";
import type { FormationName } from "../../types";
import styles from "./TopBar.module.css";

type TopBarProps = {
  formation: FormationName;
  hasPremiumAccess: boolean;
  isLocalhost: boolean;
  onClearLineup: () => void;
  onExportPitchImage: () => void;
  onFormationChange: (formation: FormationName) => void;
  onOpenPricing: () => void;
};

function cx(...classes: Array<string | false>) {
  return classes.filter(Boolean).join(" ");
}

export function TopBar({
  formation,
  hasPremiumAccess,
  isLocalhost,
  onClearLineup,
  onExportPitchImage,
  onFormationChange,
  onOpenPricing,
}: TopBarProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.brandLockup}>
        <div className={styles.brandMark} aria-hidden="true">
          <span>T</span>
        </div>
        <div>
          <p className={styles.eyebrow}>Thido</p>
          <h1 className={styles.heading}>Lineup Builder</h1>
        </div>
      </div>

      <div className={styles.formationControls} aria-label="Formation controls">
        <div className={styles.controlGroup}>
          <span>Quick Formations</span>
          <div className={styles.buttonRow}>
            {quickFormations.map((item) => (
              <button
                className={cx(styles.formationButton, formation === item && styles.active)}
                key={item}
                onClick={() => onFormationChange(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className={cx(styles.controlGroup, styles.moreGroup)}>
          <span>More Formations</span>
          <label className={styles.selectWrap}>
            <select
              aria-label="More formations"
              onChange={(event) => onFormationChange(event.target.value as FormationName)}
              value={moreFormations.includes(formation) ? formation : ""}
            >
              <option value="" disabled>
                More Formations
              </option>
              {moreFormations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown size={18} aria-hidden="true" />
          </label>
        </div>
      </div>

      <div className={styles.topActions}>
        <button className={styles.planButton} onClick={onOpenPricing} type="button">
          <Crown size={17} aria-hidden="true" />
          {hasPremiumAccess ? (isLocalhost ? "Premium Dev" : "Premium") : "Upgrade"}
        </button>
        <button className={styles.ghostButton} onClick={onClearLineup} type="button">
          <RefreshCcw size={18} aria-hidden="true" />
          Clear
        </button>
        <button className={styles.primaryButton} onClick={onExportPitchImage} type="button">
          <Download size={18} aria-hidden="true" />
          Export Image
        </button>
      </div>
    </header>
  );
}
