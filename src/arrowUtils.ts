import type { MovementArrow } from "./types";

const DEFAULT_ARROW_COLOR = "#f97316";

function normalizeCoordinate(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : fallback;
}

function normalizeArrowStyle(value: unknown) {
  return value === "dashed" ? "dashed" : "solid";
}

export function normalizeArrows(arrows: MovementArrow[] | undefined): MovementArrow[] {
  if (!Array.isArray(arrows)) {
    return [];
  }

  return arrows
    .filter((arrow) => arrow && typeof arrow.id === "string")
    .map((arrow) => ({
      id: arrow.id,
      fromX: normalizeCoordinate(arrow.fromX, 50),
      fromY: normalizeCoordinate(arrow.fromY, 50),
      toX: normalizeCoordinate(arrow.toX, 55),
      toY: normalizeCoordinate(arrow.toY, 45),
      color: typeof arrow.color === "string" && arrow.color.trim() ? arrow.color : DEFAULT_ARROW_COLOR,
      style: normalizeArrowStyle(arrow.style),
    }));
}
