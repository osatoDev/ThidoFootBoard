import { ClipboardPaste, Crown, FileJson, Image, Search, X } from "lucide-react";
import { useRef } from "react";

import { useDialogAccessibility } from "../../hooks/useDialogAccessibility";
import type { LineupImportMethod } from "../LineupImportModal/LineupImportModal";
import styles from "./ImportSourceModal.module.css";

type ImportSourceModalProps = {
  hasPremiumAccess: boolean;
  onClose: () => void;
  onSelectMethod: (method: LineupImportMethod) => void;
};

const importSources: Array<{
  description: string;
  icon: typeof Search;
  label: string;
  method: LineupImportMethod;
  premium?: boolean;
}> = [
  {
    description: "Search for a confirmed lineup by teams and date.",
    icon: Search,
    label: "Find a match",
    method: "match",
    premium: true,
  },
  {
    description: "Extract players from a lineup image.",
    icon: Image,
    label: "Upload screenshot",
    method: "screenshot",
    premium: true,
  },
  {
    description: "Paste names from a team sheet or message.",
    icon: ClipboardPaste,
    label: "Paste lineup",
    method: "text",
  },
  {
    description: "Use an existing CSV or JSON file.",
    icon: FileJson,
    label: "Upload a file",
    method: "file",
  },
];

export function ImportSourceModal({
  hasPremiumAccess,
  onClose,
  onSelectMethod,
}: ImportSourceModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useDialogAccessibility(dialogRef, closeButtonRef, onClose);

  return (
    <div className={styles.backdrop} onMouseDown={onClose} role="presentation">
      <section
        aria-labelledby="import-source-title"
        aria-modal="true"
        className={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
      >
        <header>
          <div>
            <span>Import lineup</span>
            <h2 id="import-source-title">Choose one source</h2>
            <p>You can review everything before it reaches the pitch.</p>
          </div>
          <button
            aria-label="Close import options"
            className={styles.closeButton}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.sourceGrid}>
          {importSources.map((source) => {
            const Icon = source.icon;
            const isLocked = source.premium && !hasPremiumAccess;

            return (
              <button
                className={styles.sourceButton}
                key={source.method}
                onClick={() => onSelectMethod(source.method)}
                type="button"
              >
                <span className={styles.sourceIcon}><Icon size={20} aria-hidden="true" /></span>
                <span className={styles.sourceCopy}>
                  <strong>{source.label}</strong>
                  <small>{source.description}</small>
                </span>
                {isLocked ? (
                  <span className={styles.premiumBadge}>
                    <Crown size={13} aria-hidden="true" /> Premium
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
