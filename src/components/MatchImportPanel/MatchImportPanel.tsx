import { ArrowLeftRight, CalendarDays, ChevronDown, Search } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import type { MatchLoadSide, MatchSummary } from "../../types";
import styles from "./MatchImportPanel.module.css";

type MatchImportPanelProps = {
  isLoadingLineup: boolean;
  isSearchingMatches: boolean;
  matchDate: string;
  matchImportStatus: string;
  matchLoadSide: MatchLoadSide;
  matchResults: MatchSummary[];
  onFindAndLoadLineup: () => void;
  onLoadImportedLineup: (teamId: number) => void;
  onSearchMatches: () => void;
  onSwapTeams: () => void;
  selectedMatchId: number | null;
  setMatchDate: Dispatch<SetStateAction<string>>;
  setMatchLoadSide: Dispatch<SetStateAction<MatchLoadSide>>;
  setSelectedMatchId: Dispatch<SetStateAction<number | null>>;
  setTeamA: Dispatch<SetStateAction<string>>;
  setTeamB: Dispatch<SetStateAction<string>>;
  teamA: string;
  teamB: string;
};

export function MatchImportPanel({
  isLoadingLineup,
  isSearchingMatches,
  matchDate,
  matchImportStatus,
  matchLoadSide,
  matchResults,
  onFindAndLoadLineup,
  onLoadImportedLineup,
  onSearchMatches,
  onSwapTeams,
  selectedMatchId,
  setMatchDate,
  setMatchLoadSide,
  setSelectedMatchId,
  setTeamA,
  setTeamB,
  teamA,
  teamB,
}: MatchImportPanelProps) {
  return (
    <section className={styles.matchImportPanel} aria-label="Match import">
      <div className={styles.matchImportHeader}>
        <div>
          <span>Match Import</span>
          <strong>API-Football</strong>
        </div>
        <CalendarDays size={20} aria-hidden="true" />
      </div>

      <div className={styles.matchImportGrid}>
        <label>
          <span>Date</span>
          <input
            aria-label="Match date"
            onChange={(event) => setMatchDate(event.target.value)}
            type="date"
            value={matchDate}
          />
        </label>
        <label>
          <span>Team A</span>
          <input
            aria-label="Team A"
            onChange={(event) => setTeamA(event.target.value)}
            placeholder="Arsenal"
            type="text"
            value={teamA}
          />
        </label>
        <label>
          <span>Team B</span>
          <input
            aria-label="Team B"
            onChange={(event) => setTeamB(event.target.value)}
            placeholder="Tottenham"
            type="text"
            value={teamB}
          />
        </label>
      </div>

      <div className={styles.loadSideControl} role="group" aria-label="Team to load">
        <button
          className={matchLoadSide === "teamA" ? styles.active : ""}
          onClick={() => setMatchLoadSide("teamA")}
          type="button"
        >
          Load Team A
        </button>
        <button
          className={matchLoadSide === "teamB" ? styles.active : ""}
          onClick={() => setMatchLoadSide("teamB")}
          type="button"
        >
          Load Team B
        </button>
      </div>

      <div className={styles.matchImportActions}>
        <button className={styles.ghostMiniButton} onClick={onSwapTeams} type="button">
          <ArrowLeftRight size={17} aria-hidden="true" />
          Swap
        </button>
        <button className={styles.ghostMiniButton} disabled={isSearchingMatches} onClick={onSearchMatches} type="button">
          <Search size={17} aria-hidden="true" />
          Find Only
        </button>
        <button
          className={styles.primaryMiniButton}
          disabled={!selectedMatchId || isSearchingMatches || isLoadingLineup}
          onClick={onFindAndLoadLineup}
          type="button"
        >
          <Search size={17} aria-hidden="true" />
          {isLoadingLineup ? "Loading" : "Find & Load"}
        </button>
      </div>

      {matchResults.length > 0 ? (
        <div className={styles.matchResults}>
          <label className={`${styles.selectWrap} ${styles.matchSelect}`}>
            <select
              aria-label="Matched fixtures"
              onChange={(event) => setSelectedMatchId(Number(event.target.value))}
              value={selectedMatchId ?? ""}
            >
              {matchResults.map((match) => (
                <option key={match.fixtureId} value={match.fixtureId}>
                  {match.home.name} vs {match.away.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </label>

          {matchResults
            .filter((match) => match.fixtureId === selectedMatchId)
            .map((match) => (
              <div className={styles.matchResultCard} key={match.fixtureId}>
                <div>
                  <strong>
                    {match.home.name} vs {match.away.name}
                  </strong>
                  <span>
                    {match.league.name} · {new Date(match.date).toLocaleDateString()} · {match.status}
                  </span>
                </div>
                <div className={styles.lineupLoadButtons}>
                  <button disabled={isLoadingLineup} onClick={() => onLoadImportedLineup(match.home.id)} type="button">
                    Load {match.home.name}
                  </button>
                  <button disabled={isLoadingLineup} onClick={() => onLoadImportedLineup(match.away.id)} type="button">
                    Load {match.away.name}
                  </button>
                </div>
              </div>
            ))}
        </div>
      ) : null}

      {matchImportStatus ? <p className={styles.matchImportStatus}>{matchImportStatus}</p> : null}
    </section>
  );
}
