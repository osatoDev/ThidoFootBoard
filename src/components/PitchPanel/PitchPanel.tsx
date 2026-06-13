import {
  ArrowRight,
  ChevronDown,
  MousePointer2,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import type {
  CSSProperties,
  Dispatch,
  MouseEvent,
  PointerEvent,
  RefObject,
  SetStateAction,
} from "react";

import { moreFormations, quickFormations } from "../../formations";
import { hasPlayerDetails, shortName } from "../../playerUtils";
import type {
  ArrowStyle,
  FormationName,
  MovementArrow,
  PitchTheme,
  Player,
  PositionCoordinate,
} from "../../types";
import styles from "./PitchPanel.module.css";

type PitchPanelProps = {
  arrowColor: string;
  arrowColors: string[];
  arrowStartPlayerIndex: number | null;
  arrows: MovementArrow[];
  arrowStyle: ArrowStyle;
  clearArrows: () => void;
  deleteSelectedArrow: () => void;
  draftArrow: MovementArrow | null;
  formation: FormationName;
  isDrawingArrows: boolean;
  onFormationChange: (formation: FormationName) => void;
  onArrowClick: (event: MouseEvent<SVGElement>) => void;
  onArrowMouseDown: (event: MouseEvent<SVGElement>) => void;
  onArrowMouseMove: (event: MouseEvent<SVGElement>) => void;
  onArrowMouseUp: () => void;
  onArrowPointerDown: (event: PointerEvent<SVGElement>) => void;
  onArrowPointerMove: (event: PointerEvent<SVGElement>) => void;
  onArrowPointerUp: (event: PointerEvent<SVGElement>) => void;
  onPointerDown: (
    event: PointerEvent<HTMLButtonElement>,
    index: number,
  ) => void;
  onPointerMove: (
    event: PointerEvent<HTMLButtonElement>,
    index: number,
  ) => void;
  onPointerUp: (event: PointerEvent<HTMLButtonElement>, index: number) => void;
  pitchRef: RefObject<HTMLDivElement>;
  pitchTheme: PitchTheme;
  playerBadges: boolean;
  players: Player[];
  positionSet: PositionCoordinate[];
  selectArrow: (id: string) => void;
  selectedArrowId: string | null;
  selectedPlayerIndex: number | null;
  setArrowColor: Dispatch<SetStateAction<string>>;
  setArrowStyle: Dispatch<SetStateAction<ArrowStyle>>;
  setIsDrawingArrows: Dispatch<SetStateAction<boolean>>;
  setPitchTheme: Dispatch<SetStateAction<PitchTheme>>;
  setPlayerBadges: Dispatch<SetStateAction<boolean>>;
  setSelectedPlayerIndex: Dispatch<SetStateAction<number | null>>;
  startArrowFromPlayer: (index: number) => void;
};

function cx(...classes: Array<string | false>) {
  return classes.filter(Boolean).join(" ");
}

export function PitchPanel({
  arrowColor,
  arrowColors,
  arrowStartPlayerIndex,
  arrows,
  arrowStyle,
  clearArrows,
  deleteSelectedArrow,
  draftArrow,
  formation,
  isDrawingArrows,
  onFormationChange,
  onArrowClick,
  onArrowMouseDown,
  onArrowMouseMove,
  onArrowMouseUp,
  onArrowPointerDown,
  onArrowPointerMove,
  onArrowPointerUp,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  pitchRef,
  pitchTheme,
  playerBadges,
  players,
  positionSet,
  selectArrow,
  selectedArrowId,
  selectedPlayerIndex,
  setArrowColor,
  setArrowStyle,
  setIsDrawingArrows,
  setPitchTheme,
  setPlayerBadges,
  setSelectedPlayerIndex,
  startArrowFromPlayer,
}: PitchPanelProps) {
  const visibleArrows = draftArrow ? [...arrows, draftArrow] : arrows;

  return (
    <section
      className={cx(styles.pitchPanel, pitchTheme === "dark" && styles.dark)}
      aria-label="Football pitch"
    >
      <div className={styles.pitchToolbar}>
        <label className={cx(styles.selectWrap, styles.compactSelect)}>
          <select
            aria-label="Current formation"
            onChange={(event) =>
              onFormationChange(event.target.value as FormationName)
            }
            value={formation}
          >
            {[...quickFormations, ...moreFormations].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <ChevronDown size={18} aria-hidden="true" />
        </label>

        <div className={styles.arrowToolCluster} aria-label="Arrow tools">
          <button
            className={!isDrawingArrows ? styles.active : ""}
            onClick={() => setIsDrawingArrows(false)}
            type="button"
            aria-label="Select arrows and players"
            title="Select or move players"
          >
            <MousePointer2 size={18} aria-hidden="true" />
            <span>Select</span>
          </button>
          <button
            className={isDrawingArrows ? styles.active : ""}
            onClick={() => setIsDrawingArrows(true)}
            type="button"
            aria-label="Draw movement arrow"
            title="Draw arrows. Double-click a player to start an arrow from that player."
          >
            <ArrowRight size={18} aria-hidden="true" />
            <span>Arrow</span>
          </button>
        </div>
      </div>

      <div className={styles.pitch} ref={pitchRef}>
        <div className={cx(styles.pitchLine, styles.outerLine)} />
        <div className={cx(styles.pitchLine, styles.halfLine)} />
        <div className={cx(styles.pitchLine, styles.centerCircle)} />
        <div className={cx(styles.pitchLine, styles.topBox)} />
        <div className={cx(styles.pitchLine, styles.topGoalBox)} />
        <div className={cx(styles.pitchLine, styles.bottomBox)} />
        <div className={cx(styles.pitchLine, styles.bottomGoalBox)} />
        <div className={cx(styles.pitchLine, styles.topArc)} />
        <div className={cx(styles.pitchLine, styles.bottomArc)} />
        <div className={cx(styles.pitchLine, styles.corner, styles.topLeft)} />
        <div className={cx(styles.pitchLine, styles.corner, styles.topRight)} />
        <div
          className={cx(styles.pitchLine, styles.corner, styles.bottomLeft)}
        />
        <div
          className={cx(styles.pitchLine, styles.corner, styles.bottomRight)}
        />

        <svg
          className={cx(styles.arrowLayer, isDrawingArrows && styles.drawing)}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-label="Movement arrows"
        >
          <rect
            className={styles.arrowCapture}
            onClick={onArrowClick}
            onMouseDown={onArrowMouseDown}
            onMouseMove={onArrowMouseMove}
            onMouseUp={onArrowMouseUp}
            onPointerDown={onArrowPointerDown}
            onPointerMove={onArrowPointerMove}
            onPointerUp={onArrowPointerUp}
            x="0"
            y="0"
            width="100"
            height="100"
          />
          <defs>
            {visibleArrows.map((arrow) => (
              <marker
                id={`arrowhead-${arrow.id}`}
                key={arrow.id}
                markerHeight="8"
                markerWidth="8"
                orient="auto"
                refX="7"
                refY="4"
                viewBox="0 0 8 8"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill={arrow.color} />
              </marker>
            ))}
          </defs>
          {visibleArrows.map((arrow) => {
            const isSelected = selectedArrowId === arrow.id;

            return (
              <g
                aria-label="Select movement arrow"
                className={cx(
                  styles.movementArrow,
                  isSelected && styles.selected,
                )}
                key={arrow.id}
                onKeyDown={(event) => {
                  if (
                    !isDrawingArrows &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    selectArrow(arrow.id);
                  }
                }}
                role="button"
                tabIndex={isDrawingArrows ? -1 : 0}
              >
                <line
                  className={styles.movementArrowPath}
                  markerEnd={`url(#arrowhead-${arrow.id})`}
                  stroke={arrow.color}
                  strokeDasharray={arrow.style === "dashed" ? "5 4" : undefined}
                  x1={arrow.fromX}
                  x2={arrow.toX}
                  y1={arrow.fromY}
                  y2={arrow.toY}
                />
                <line
                  className={styles.movementArrowHit}
                  onPointerDown={(event) => {
                    if (!isDrawingArrows) {
                      event.stopPropagation();
                      selectArrow(arrow.id);
                    }
                  }}
                  x1={arrow.fromX}
                  x2={arrow.toX}
                  y1={arrow.fromY}
                  y2={arrow.toY}
                />
              </g>
            );
          })}
        </svg>

        {players.map((player, index) => {
          if (!hasPlayerDetails(player)) {
            return null;
          }

          const position = positionSet[index];
          const x = player.customX ?? position.x;
          const y = player.customY ?? position.y;
          const isSelected = selectedPlayerIndex === index;
          const isArrowStart = arrowStartPlayerIndex === index;
          const playerName = shortName(player.name);

          return (
            <button
              aria-label={`Player ${player.number || index + 1} ${position.role}`}
              className={cx(
                styles.playerMarker,
                isSelected && styles.selected,
                isArrowStart && styles.arrowStart,
                selectedPlayerIndex !== null && !isSelected && styles.dimmed,
              )}
              key={`${position.role}-${index}`}
              onClick={() => setSelectedPlayerIndex(index)}
              onPointerDown={(event) => onPointerDown(event, index)}
              onPointerMove={(event) => onPointerMove(event, index)}
              onPointerUp={(event) => onPointerUp(event, index)}
              onDoubleClick={(event) => {
                event.preventDefault();
                startArrowFromPlayer(index);
              }}
              style={{ left: `${x}%`, top: `${y}%` }}
              title={
                isDrawingArrows
                  ? "Double-click to start an arrow from this player"
                  : undefined
              }
              type="button"
            >
              <span className={styles.playerDisc}>
                {playerBadges ? (
                  player.number || index + 1
                ) : (
                  <UserRound size={28} aria-hidden="true" />
                )}
              </span>
              {playerName ? (
                <span className={styles.playerName}>{playerName}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className={styles.pitchOptions}>
        <div className={styles.pitchOptionGroup}>
          <div
            className={styles.segmentedControl}
            role="group"
            aria-label="Pitch theme"
          >
            <button
              className={pitchTheme === "classic" ? styles.active : ""}
              onClick={() => setPitchTheme("classic")}
              type="button"
            >
              Pitch
            </button>
            <button
              className={pitchTheme === "dark" ? styles.active : ""}
              onClick={() => setPitchTheme("dark")}
              type="button"
            >
              Dark
            </button>
          </div>

          <button
            className={styles.darkToolButton}
            onClick={() => setPlayerBadges((current) => !current)}
            type="button"
          >
            <UserRound size={18} aria-hidden="true" />
            {playerBadges ? "Numbers" : "Icons"}
          </button>
        </div>

        <div className={styles.arrowOptions} aria-label="Arrow options">
          <div className={styles.arrowColorRow}>
            {arrowColors.map((color) => (
              <button
                className={arrowColor === color ? styles.active : ""}
                key={color}
                onClick={() => setArrowColor(color)}
                style={{ "--arrow-color": color } as CSSProperties}
                type="button"
                aria-label={`Use ${color} arrows`}
              />
            ))}
          </div>

          <div
            className={cx(styles.segmentedControl, styles.arrowStyleControl)}
            role="group"
            aria-label="Arrow style"
          >
            <button
              className={arrowStyle === "solid" ? styles.active : ""}
              onClick={() => setArrowStyle("solid")}
              type="button"
            >
              Solid
            </button>
            <button
              className={arrowStyle === "dashed" ? styles.active : ""}
              onClick={() => setArrowStyle("dashed")}
              type="button"
            >
              Dashed
            </button>
          </div>

          <button
            className={styles.darkIconButton}
            disabled={!selectedArrowId}
            onClick={deleteSelectedArrow}
            type="button"
            aria-label="Delete selected arrow"
            title="Delete selected arrow"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
          <button
            className={styles.clearArrowsButton}
            disabled={arrows.length === 0 && !draftArrow}
            onClick={clearArrows}
            type="button"
            aria-label="Clear arrows"
            title="Clear all arrows from the pitch"
          >
            <X size={18} aria-hidden="true" />
            <span>Clear arrows</span>
          </button>
        </div>
      </div>
    </section>
  );
}
