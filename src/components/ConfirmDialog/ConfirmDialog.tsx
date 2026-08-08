import { AlertTriangle, X } from "lucide-react";
import { useRef } from "react";

import { useDialogAccessibility } from "../../hooks/useDialogAccessibility";
import styles from "./ConfirmDialog.module.css";

type ConfirmDialogProps = {
  confirmLabel: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

export function ConfirmDialog({ confirmLabel, description, onCancel, onConfirm, title }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useDialogAccessibility(dialogRef, cancelRef, onCancel);

  return (
    <div className={styles.backdrop} onMouseDown={onCancel} role="presentation">
      <section
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="alertdialog"
      >
        <div className={styles.iconWrap}><AlertTriangle size={22} aria-hidden="true" /></div>
        <button aria-label="Close confirmation" className={styles.closeButton} onClick={onCancel} type="button">
          <X size={18} aria-hidden="true" />
        </button>
        <div className={styles.copy}>
          <h2 id="confirm-dialog-title">{title}</h2>
          <p>{description}</p>
        </div>
        <footer>
          <button className={styles.cancelButton} onClick={onCancel} ref={cancelRef} type="button">Cancel</button>
          <button className={styles.confirmButton} onClick={onConfirm} type="button">{confirmLabel}</button>
        </footer>
      </section>
    </div>
  );
}
