import { ExternalLink, FileJson, Image, LoaderCircle, Plus, Search, Sparkles, Trash2, Upload, X } from "lucide-react";
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";

import { formations } from "../../formations";
import { useDialogAccessibility } from "../../hooks/useDialogAccessibility";
import { parseCsvLineup, parseJsonLineup, parseTextLineup } from "../../lineupImport";
import { trackFeature, trackProductEvent } from "../../pendo";
import {
  extractLineupScreenshot,
  findMatchLineup,
  type AiLineupExtraction,
} from "../../lineupScreenshotApi";
import type { FormationName, ManualLineupImport } from "../../types";
import styles from "./LineupImportModal.module.css";

export type LineupImportMethod = "screenshot" | "match" | "file" | "text";

type LineupImportModalProps = {
  method: LineupImportMethod;
  onClose: () => void;
  onImportLineup: (lineup: ManualLineupImport) => void;
};

const methodTitles: Record<LineupImportMethod, string> = {
  screenshot: "Upload screenshot",
  match: "Find match lineup",
  file: "Import CSV or JSON",
  text: "Paste lineup text",
};

export function LineupImportModal({
  method,
  onClose,
  onImportLineup,
}: LineupImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedLineup, setExtractedLineup] = useState<AiLineupExtraction | null>(null);
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [approximateDate, setApproximateDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [teamToImport, setTeamToImport] = useState<"teamA" | "teamB">("teamA");
  const extractionControllerRef = useRef<AbortController | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const previewUrl = useMemo(
    () => (method === "screenshot" && file ? URL.createObjectURL(file) : ""),
    [file, method],
  );

  useEffect(() => {
    return () => {
      extractionControllerRef.current?.abort();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useDialogAccessibility(dialogRef, closeButtonRef, onClose);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setExtractedLineup(null);
    setError("");
  }

  function updateExtractedPlayer(
    group: "players" | "substitutes",
    index: number,
    field: "name" | "number",
    value: string,
  ) {
    setExtractedLineup((current) =>
      current
        ? {
            ...current,
            [group]: current[group].map((player, playerIndex) =>
              playerIndex === index ? { ...player, [field]: value } : player,
            ),
          }
        : current,
    );
  }

  function removeExtractedPlayer(group: "players" | "substitutes", index: number) {
    setExtractedLineup((current) =>
      current
        ? {
            ...current,
            [group]: current[group].filter((_, playerIndex) => playerIndex !== index),
          }
        : current,
    );
  }

  function addExtractedPlayer(group: "players" | "substitutes") {
    setExtractedLineup((current) =>
      current
        ? {
            ...current,
            [group]: [...current[group], { confidence: 1, name: "", number: "" }],
          }
        : current,
    );
  }

  function applyExtractedLineup() {
    if (!extractedLineup) {
      return;
    }

    const players = extractedLineup.players.filter((player) => player.name.trim() || player.number.trim());
    if (players.length === 0) {
      setError("Add at least one starting player.");
      return;
    }

    const importedLineup = {
      formation: extractedLineup.formation,
      name: extractedLineup.name,
      players: players.map(({ name, number }) => ({ name: name.trim(), number: number.trim() })),
      substitutes: extractedLineup.substitutes
        .filter((player) => player.name.trim() || player.number.trim())
        .map(({ name, number }) => ({ name: name.trim(), number: number.trim() })),
    };
    onImportLineup(importedLineup);
    trackFeature("lineup_import_completed", {
      method,
      starters: importedLineup.players.length,
      substitutes: importedLineup.substitutes.length,
    });
    onClose();
  }

  async function submitImport() {
    const startedAt = performance.now();
    trackFeature("lineup_import_started", { method });
    try {
      if (method === "screenshot") {
        if (!file) {
          throw new Error("Choose a screenshot first.");
        }
        setIsExtracting(true);
        setError("");
        extractionControllerRef.current?.abort();
        const controller = new AbortController();
        extractionControllerRef.current = controller;
        const result = await extractLineupScreenshot(file, controller.signal);
        setExtractedLineup(result);
        trackProductEvent("lineup_import_review_ready", {
          duration_ms: Math.round(performance.now() - startedAt),
          method,
          starters: result.players.length,
          substitutes: result.substitutes.length,
        });
        return;
      }

      if (method === "match") {
        if (!teamA.trim() || !teamB.trim() || !approximateDate) {
          throw new Error("Add both teams and an approximate date.");
        }
        setIsExtracting(true);
        setError("");
        extractionControllerRef.current?.abort();
        const controller = new AbortController();
        extractionControllerRef.current = controller;
        const result = await findMatchLineup(
            {
              approximateDate,
              teamA: teamA.trim(),
              teamB: teamB.trim(),
              teamToImport,
            },
            controller.signal,
          );
        setExtractedLineup(result);
        trackProductEvent("lineup_import_review_ready", {
          duration_ms: Math.round(performance.now() - startedAt),
          method,
          starters: result.players.length,
          substitutes: result.substitutes.length,
        });
        return;
      }

      if (method === "file") {
        if (!file) {
          throw new Error("Choose a CSV or JSON file first.");
        }
        const source = await file.text();
        const lineup = file.name.toLowerCase().endsWith(".json") ? parseJsonLineup(source) : parseCsvLineup(source);
        onImportLineup(lineup);
        trackFeature("lineup_import_completed", {
          file_type: file.name.toLowerCase().endsWith(".json") ? "json" : "csv",
          method,
          starters: lineup.players.length,
          substitutes: lineup.substitutes.length,
        });
        onClose();
        return;
      }

      const lineup = parseTextLineup(text);
      onImportLineup(lineup);
      trackFeature("lineup_import_completed", {
        method,
        starters: lineup.players.length,
        substitutes: lineup.substitutes.length,
      });
      onClose();
    } catch (importError) {
      if (importError instanceof DOMException && importError.name === "AbortError") {
        return;
      }
      setError(importError instanceof Error ? importError.message : "Could not import this lineup.");
      trackProductEvent("lineup_import_failed", {
        duration_ms: Math.round(performance.now() - startedAt),
        error_type: importError instanceof Error ? importError.name : "unknown",
        method,
      });
    } finally {
      extractionControllerRef.current = null;
      setIsExtracting(false);
    }
  }

  return (
    <div className={styles.backdrop} onMouseDown={onClose} role="presentation">
      <section
        aria-labelledby="lineup-import-title"
        aria-modal="true"
        className={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
      >
        <header>
          <div>
            <span>Import lineup</span>
            <h2 id="lineup-import-title">{methodTitles[method]}</h2>
          </div>
          <button aria-label="Close import modal" className={styles.closeButton} onClick={onClose} ref={closeButtonRef} type="button">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {method === "screenshot" ? (
          <div className={styles.modalBody}>
            <p className={styles.helperText}>
              Claude reads the team name, formation, starters, shirt numbers, and substitutes. Review every result
              before applying it.
            </p>
            {!extractedLineup ? (
              <>
                <label className={styles.dropZone}>
                  <Image size={28} aria-hidden="true" />
                  <strong>{file ? file.name : "Choose a lineup screenshot"}</strong>
                  <span>PNG, JPG, or WebP · 10 MB maximum</span>
                  <input
                    accept="image/png,image/jpeg,image/webp"
                    disabled={isExtracting}
                    onChange={selectFile}
                    type="file"
                  />
                </label>
                {previewUrl ? (
                  <img alt="Selected lineup screenshot" className={styles.imagePreview} src={previewUrl} />
                ) : null}
              </>
            ) : (
              <LineupReview
                extractedLineup={extractedLineup}
                onAdd={addExtractedPlayer}
                onRemove={removeExtractedPlayer}
                onSetLineup={setExtractedLineup}
                onUpdate={updateExtractedPlayer}
                previewUrl={previewUrl}
              />
            )}
          </div>
        ) : null}

        {method === "match" ? (
          <div className={styles.modalBody}>
            <p className={styles.helperText}>
              Claude searches the live web for a confirmed lineup near the supplied date. Predicted lineups are
              rejected, and sources are shown for review.
            </p>
            {!extractedLineup ? (
              <div className={styles.matchLookupForm}>
                <label>
                  <span>Team A</span>
                  <input
                    autoFocus
                    onChange={(event) => setTeamA(event.target.value)}
                    placeholder="Home team"
                    type="text"
                    value={teamA}
                  />
                </label>
                <label>
                  <span>Team B</span>
                  <input
                    onChange={(event) => setTeamB(event.target.value)}
                    placeholder="Away team"
                    type="text"
                    value={teamB}
                  />
                </label>
                <label>
                  <span>Approximate date</span>
                  <input
                    onChange={(event) => setApproximateDate(event.target.value)}
                    type="date"
                    value={approximateDate}
                  />
                </label>
                <label>
                  <span>Lineup to import</span>
                  <select
                    onChange={(event) => setTeamToImport(event.target.value as "teamA" | "teamB")}
                    value={teamToImport}
                  >
                    <option value="teamA">{teamA.trim() || "Team A"}</option>
                    <option value="teamB">{teamB.trim() || "Team B"}</option>
                  </select>
                </label>
              </div>
            ) : (
              <LineupReview
                extractedLineup={extractedLineup}
                onAdd={addExtractedPlayer}
                onRemove={removeExtractedPlayer}
                onSetLineup={setExtractedLineup}
                onUpdate={updateExtractedPlayer}
              />
            )}
          </div>
        ) : null}

        {method === "file" ? (
          <div className={styles.modalBody}>
            <p className={styles.helperText}>
              JSON can contain <code>players</code>, <code>startingXI</code>, and <code>substitutes</code>. CSV should
              include name, number, and an optional section column.
            </p>
            <label className={styles.dropZone}>
              <FileJson size={28} aria-hidden="true" />
              <strong>{file ? file.name : "Choose a CSV or JSON file"}</strong>
              <span>.csv or .json</span>
              <input accept=".csv,.json,application/json,text/csv" onChange={selectFile} type="file" />
            </label>
          </div>
        ) : null}

        {method === "text" ? (
          <div className={styles.modalBody}>
            <p className={styles.helperText}>
              Paste a starting XI, then add a line beginning with “Substitutes:” or “Bench:” for the remaining players.
            </p>
            <textarea
              aria-label="Lineup text"
              autoFocus
              onChange={(event) => {
                setText(event.target.value);
                setError("");
              }}
              placeholder={"Starting XI (4-3-3):\n1 Goalkeeper\n2 Right back\n...\n\nSubstitutes:\n12 Substitute"}
              rows={13}
              value={text}
            />
          </div>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}

        <footer>
          <button className={styles.cancelButton} onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className={styles.importButton}
            disabled={
              isExtracting ||
              (method === "text"
                ? !text.trim()
                : method === "match"
                  ? !extractedLineup && (!teamA.trim() || !teamB.trim() || !approximateDate)
                  : !file)
            }
            onClick={(method === "screenshot" || method === "match") && extractedLineup ? applyExtractedLineup : submitImport}
            type="button"
          >
            {isExtracting ? (
              <LoaderCircle className={styles.spinner} size={17} aria-hidden="true" />
            ) : method === "screenshot" ? (
              <Sparkles size={17} aria-hidden="true" />
            ) : method === "match" ? (
              <Search size={17} aria-hidden="true" />
            ) : (
              <Upload size={17} aria-hidden="true" />
            )}
            {isExtracting
              ? method === "match"
                ? "Searching web"
                : "Reading screenshot"
              : method === "screenshot" || method === "match"
                ? extractedLineup
                  ? "Apply lineup"
                  : method === "match"
                    ? "Find lineup"
                    : "Extract lineup"
                : "Import lineup"}
          </button>
        </footer>
      </section>
    </div>
  );
}

type LineupReviewProps = {
  extractedLineup: AiLineupExtraction;
  onAdd: (group: "players" | "substitutes") => void;
  onRemove: (group: "players" | "substitutes", index: number) => void;
  onSetLineup: Dispatch<SetStateAction<AiLineupExtraction | null>>;
  onUpdate: (
    group: "players" | "substitutes",
    index: number,
    field: "name" | "number",
    value: string,
  ) => void;
  previewUrl?: string;
};

function LineupReview({
  extractedLineup,
  onAdd,
  onRemove,
  onSetLineup,
  onUpdate,
  previewUrl,
}: LineupReviewProps) {
  return (
    <div className={styles.reviewLayout}>
      {previewUrl ? <img alt="Lineup screenshot being reviewed" className={styles.reviewImage} src={previewUrl} /> : null}

      {extractedLineup.match ? (
        <div className={styles.matchSummary}>
          <strong>
            {extractedLineup.match.homeTeam} vs {extractedLineup.match.awayTeam}
          </strong>
          <span>
            {extractedLineup.match.exactDate}
            {extractedLineup.match.competition ? ` · ${extractedLineup.match.competition}` : ""}
          </span>
          <div className={styles.sourceList}>
            {extractedLineup.match.sources.map((source) => (
              <a href={source.url} key={source.url} rel="noreferrer" target="_blank">
                {source.title}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.reviewFields}>
        <label>
          <span>Lineup name</span>
          <input
            onChange={(event) =>
              onSetLineup((current) => (current ? { ...current, name: event.target.value } : current))
            }
            type="text"
            value={extractedLineup.name}
          />
        </label>
        <label>
          <span>Formation</span>
          <select
            onChange={(event) =>
              onSetLineup((current) =>
                current
                  ? {
                      ...current,
                      formation: (event.target.value || undefined) as FormationName | undefined,
                    }
                  : current,
              )
            }
            value={extractedLineup.formation ?? ""}
          >
            <option value="">Not detected</option>
            {(Object.keys(formations) as FormationName[]).map((formation) => (
              <option key={formation} value={formation}>
                {formation}
              </option>
            ))}
          </select>
        </label>
      </div>

      {extractedLineup.warnings.length > 0 ? (
        <div className={styles.warnings}>
          <strong>Review notes</strong>
          {extractedLineup.warnings.map((warning) => (
            <span key={warning}>{warning}</span>
          ))}
        </div>
      ) : null}

      <LineupReviewGroup
        label="Starting XI"
        maxPlayers={11}
        onAdd={() => onAdd("players")}
        onRemove={(index) => onRemove("players", index)}
        onUpdate={(index, field, value) => onUpdate("players", index, field, value)}
        players={extractedLineup.players}
      />
      <LineupReviewGroup
        label="Substitutes"
        onAdd={() => onAdd("substitutes")}
        onRemove={(index) => onRemove("substitutes", index)}
        onUpdate={(index, field, value) => onUpdate("substitutes", index, field, value)}
        players={extractedLineup.substitutes}
      />
    </div>
  );
}

type LineupReviewGroupProps = {
  label: string;
  maxPlayers?: number;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: "name" | "number", value: string) => void;
  players: AiLineupExtraction["players"];
};

function LineupReviewGroup({
  label,
  maxPlayers,
  onAdd,
  onRemove,
  onUpdate,
  players,
}: LineupReviewGroupProps) {
  return (
    <section className={styles.reviewGroup}>
      <header>
        <strong>{label}</strong>
        <span>{players.length}</span>
      </header>
      <div className={styles.reviewPlayers}>
        {players.map((player, index) => (
          <div className={player.confidence < 0.7 ? styles.lowConfidence : ""} key={`${label}-${index}`}>
            <span>{index + 1}</span>
            <input
              aria-label={`${label} player ${index + 1} name`}
              onChange={(event) => onUpdate(index, "name", event.target.value)}
              placeholder="Player name"
              type="text"
              value={player.name}
            />
            <input
              aria-label={`${label} player ${index + 1} number`}
              inputMode="numeric"
              onChange={(event) => onUpdate(index, "number", event.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="#"
              type="text"
              value={player.number}
            />
            <button aria-label={`Remove ${label} player ${index + 1}`} onClick={() => onRemove(index)} type="button">
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      {!maxPlayers || players.length < maxPlayers ? (
        <button className={styles.addPlayerButton} onClick={onAdd} type="button">
          <Plus size={15} aria-hidden="true" />
          Add player
        </button>
      ) : null}
    </section>
  );
}
