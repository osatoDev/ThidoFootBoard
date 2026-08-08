import { Download, FileInput, PencilRuler, X } from "lucide-react";
import { useEffect, useRef } from "react";

import styles from "./HowItWorksModal.module.css";

type HowItWorksModalProps = {
  onClose: () => void;
};

const steps = [
  {
    description: "Start blank, paste a squad, upload a screenshot, or find a confirmed match lineup.",
    icon: FileInput,
    number: "01",
    title: "Choose your lineup",
  },
  {
    description: "Edit names and numbers, drag players into position, and draw movement arrows.",
    icon: PencilRuler,
    number: "02",
    title: "Shape the tactics",
  },
  {
    description: "Save lineups in your browser and export a clean image when it is ready to share.",
    icon: Download,
    number: "03",
    title: "Save and share",
  },
];

export function HowItWorksModal({ onClose }: HowItWorksModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onMouseDown={onClose} role="presentation">
      <section
        aria-labelledby="how-it-works-title"
        aria-modal="true"
        className={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className={styles.header}>
          <div>
            <span>Three simple steps</span>
            <h2 id="how-it-works-title">Build a match-ready lineup in minutes</h2>
            <p>Bring the team. Thido gives you the pitch, tools, and finished graphic.</p>
          </div>
          <button
            aria-label="Close how it works"
            className={styles.closeButton}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.steps}>
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article className={styles.step} key={step.number}>
                <div className={styles.stepTopline}>
                  <div className={styles.iconWrap}>
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <span>{step.number}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            );
          })}
        </div>

        <footer className={styles.footer}>
          <p>No account is needed to start building.</p>
          <button onClick={onClose} type="button">Start building</button>
        </footer>
      </section>
    </div>
  );
}
