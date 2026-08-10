import { Lightbulb, LoaderCircle, Send, X } from "lucide-react";
import { FormEvent, useRef, useState } from "react";

import type { FeatureSuggestionCategory } from "../../../api/_featureSuggestion";
import { submitFeatureSuggestion } from "../../featureSuggestions";
import { useDialogAccessibility } from "../../hooks/useDialogAccessibility";
import { trackFeature, trackProductEvent } from "../../pendo";
import styles from "./FeatureSuggestionModal.module.css";

type FeatureSuggestionModalProps = {
  onClose: () => void;
};

const categoryOptions: Array<{
  label: string;
  value: FeatureSuggestionCategory;
}> = [
  { label: "Lineup building", value: "lineup-building" },
  { label: "Imports", value: "imports" },
  { label: "Design or export", value: "design-export" },
  { label: "Saving or sharing", value: "saving-sharing" },
  { label: "Something else", value: "other" },
];

export function FeatureSuggestionModal({ onClose }: FeatureSuggestionModalProps) {
  const [category, setCategory] =
    useState<FeatureSuggestionCategory>("lineup-building");
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useDialogAccessibility(dialogRef, closeButtonRef, onClose);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startedAt = performance.now();
    setError("");
    setIsSubmitting(true);

    try {
      await submitFeatureSuggestion(category, suggestion);
      setIsSubmitted(true);
      trackFeature("feature_suggestion_submitted", { category });
      trackProductEvent("feature_suggestion_received", {
        category,
        duration_ms: Math.round(performance.now() - startedAt),
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Could not send your suggestion.",
      );
      trackProductEvent("feature_suggestion_failed", { category });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.backdrop} onMouseDown={onClose} role="presentation">
      <section
        aria-labelledby="feature-suggestion-title"
        aria-modal="true"
        className={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
      >
        <header className={styles.header}>
          <div className={styles.iconWrap} aria-hidden="true">
            <Lightbulb size={22} />
          </div>
          <div>
            <span>Shape what comes next</span>
            <h2 id="feature-suggestion-title">Suggest a feature</h2>
            <p>What would make Thido more useful for your team?</p>
          </div>
          <button
            aria-label="Close feature suggestion"
            className={styles.closeButton}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {isSubmitted ? (
          <div className={styles.success} role="status">
            <strong>Thanks — your idea is with us.</strong>
            <p>We review suggestions when planning what to build next.</p>
            <button onClick={onClose} type="button">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              <span>Area</span>
              <select
                onChange={(event) =>
                  setCategory(event.target.value as FeatureSuggestionCategory)
                }
                value={category}
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Your idea</span>
              <textarea
                aria-describedby={error ? "feature-suggestion-error" : undefined}
                autoFocus
                maxLength={1200}
                minLength={10}
                onChange={(event) => {
                  setSuggestion(event.target.value);
                  setError("");
                }}
                placeholder="I’d love to be able to…"
                required
                rows={6}
                value={suggestion}
              />
              <small>{suggestion.length}/1,200</small>
            </label>

            {error ? (
              <p className={styles.error} id="feature-suggestion-error" role="alert">
                {error}
              </p>
            ) : null}

            <footer>
              <button className={styles.cancelButton} onClick={onClose} type="button">
                Cancel
              </button>
              <button
                className={styles.submitButton}
                disabled={isSubmitting || suggestion.trim().length < 10}
                type="submit"
              >
                {isSubmitting ? (
                  <LoaderCircle className={styles.spinner} size={17} aria-hidden="true" />
                ) : (
                  <Send size={17} aria-hidden="true" />
                )}
                {isSubmitting ? "Sending" : "Send suggestion"}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}
