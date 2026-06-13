import { hasPlayerDetails, shortName } from "./playerUtils";
import type { MovementArrow, PitchTheme, Player, PositionCoordinate } from "./types";

type ExportPitchImageOptions = {
  arrows: MovementArrow[];
  lineupName: string;
  pitchTheme: PitchTheme;
  players: Player[];
  positionSet: PositionCoordinate[];
};

function drawPitchLines(context: CanvasRenderingContext2D, width: number, height: number) {
  context.strokeStyle = "rgba(255,255,255,0.64)";
  context.lineWidth = 5;
  context.strokeRect(width * 0.07, height * 0.06, width * 0.86, height * 0.88);
  context.beginPath();
  context.moveTo(width * 0.07, height * 0.5);
  context.lineTo(width * 0.93, height * 0.5);
  context.stroke();
  context.beginPath();
  context.arc(width * 0.5, height * 0.5, width * 0.12, 0, Math.PI * 2);
  context.stroke();
  context.strokeRect(width * 0.28, height * 0.06, width * 0.44, height * 0.17);
  context.strokeRect(width * 0.38, height * 0.06, width * 0.24, height * 0.08);
  context.strokeRect(width * 0.28, height * 0.77, width * 0.44, height * 0.17);
  context.strokeRect(width * 0.38, height * 0.86, width * 0.24, height * 0.08);
  context.beginPath();
  context.arc(width * 0.5, height * 0.77, width * 0.1, Math.PI, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.arc(width * 0.5, height * 0.23, width * 0.1, 0, Math.PI);
  context.stroke();
}

function drawMovementArrow(context: CanvasRenderingContext2D, arrow: MovementArrow, width: number, height: number) {
  const fromX = (arrow.fromX / 100) * width;
  const fromY = (arrow.fromY / 100) * height;
  const toX = (arrow.toX / 100) * width;
  const toY = (arrow.toY / 100) * height;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headLength = 48;

  context.save();
  context.strokeStyle = arrow.color;
  context.fillStyle = arrow.color;
  context.lineWidth = 12;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.setLineDash(arrow.style === "dashed" ? [32, 28] : []);
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.lineTo(toX, toY);
  context.stroke();
  context.setLineDash([]);
  context.beginPath();
  context.moveTo(toX, toY);
  context.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
  context.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
  context.closePath();
  context.fill();
  context.restore();
}

export function exportPitchImage({ arrows, lineupName, pitchTheme, players, positionSet }: ExportPitchImageOptions) {
  const width = 1800;
  const height = 1400;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const gradient = context.createLinearGradient(0, 0, width, height);
  if (pitchTheme === "dark") {
    gradient.addColorStop(0, "#071712");
    gradient.addColorStop(1, "#153c25");
  } else {
    gradient.addColorStop(0, "#145c25");
    gradient.addColorStop(1, "#2f8f36");
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  for (let index = 0; index < 12; index += 1) {
    context.fillStyle = index % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
    context.fillRect(0, (height / 12) * index, width, height / 12);
  }

  drawPitchLines(context, width, height);
  arrows.forEach((arrow) => drawMovementArrow(context, arrow, width, height));

  context.font = "700 44px Inter, Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";

  players.forEach((player, index) => {
    if (!hasPlayerDetails(player)) {
      return;
    }

    const position = positionSet[index];
    const x = ((player.customX ?? position.x) / 100) * width;
    const y = ((player.customY ?? position.y) / 100) * height;
    const label = shortName(player.name);

    context.fillStyle = "rgba(0,0,0,0.42)";
    context.beginPath();
    context.arc(x + 8, y + 8, 58, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#111917";
    context.beginPath();
    context.arc(x, y, 58, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.82)";
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = "#ffffff";
    context.fillText(player.number || String(index + 1), x, y);

    if (!label) {
      return;
    }

    const labelWidth = Math.max(170, Math.min(320, label.length * 24 + 38));
    context.fillStyle = "#ffffff";
    context.strokeStyle = "rgba(0,0,0,0.15)";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(x - labelWidth / 2, y + 76, labelWidth, 54, 14);
    context.fill();
    context.stroke();
    context.fillStyle = "#111827";
    context.font = "700 26px Inter, Arial, sans-serif";
    context.fillText(label, x, y + 103);
    context.font = "700 44px Inter, Arial, sans-serif";
  });

  const link = document.createElement("a");
  link.download = `${(lineupName.trim() || "thido-lineup").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
