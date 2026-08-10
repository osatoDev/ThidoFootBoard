import {
  CircleHelp,
  Download,
  Lightbulb,
  MoreHorizontal,
  RefreshCcw,
} from "lucide-react";
import { useState } from "react";

import styles from "./TopBar.module.css";

type TopBarProps = {
  canExport: boolean;
  onClearLineup: () => void;
  onExportPitchImage: () => void;
  onOpenHowItWorks: () => void;
  onOpenSuggestion: () => void;
};

export function TopBar({
  canExport,
  onClearLineup,
  onExportPitchImage,
  onOpenHowItWorks,
  onOpenSuggestion,
}: TopBarProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

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
        <button className={styles.suggestionButton} onClick={onOpenSuggestion} type="button">
          <Lightbulb size={17} aria-hidden="true" />
          Suggest a feature
        </button>
        {canExport ? (
          <>
            <button className={styles.primaryButton} onClick={onExportPitchImage} type="button">
              <Download size={18} aria-hidden="true" />
              Export
            </button>
            <div className={styles.moreMenu}>
              <button
                aria-expanded={isMoreOpen}
                aria-haspopup="menu"
                aria-label="More lineup actions"
                className={styles.moreButton}
                onClick={() => setIsMoreOpen((current) => !current)}
                type="button"
              >
                <MoreHorizontal size={20} aria-hidden="true" />
              </button>
              {isMoreOpen ? (
                <div className={styles.menuPopover} role="menu">
                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      onClearLineup();
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <RefreshCcw size={17} aria-hidden="true" />
                    Clear lineup
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}
