import type { SimState } from "./types";

const MAX_LENGTH = 400;

/** История статистики: кольцевые массивы последних MAX_LENGTH тактов */
export interface StatsHistory {
  ticks: number[];
  peaceful: number[];
  protector: number[];
  aggressor: number[];
  avgAgg: number[];
}

/** Создаёт пустую историю статистики */
export function createStatsHistory(): StatsHistory {
  return { ticks: [], peaceful: [], protector: [], aggressor: [], avgAgg: [] };
}

/**
 * Собирает срез статистики за текущий такт: численность трёх групп
 * и средняя агрессия. Добавляет в историю, обрезает до MAX_LENGTH.
 */
export function collectStats(history: StatsHistory, state: SimState): void {
  const { cells, params } = state;
  let peaceful = 0, protector = 0, aggressor = 0, totalAgg = 0;

  for (let i = 0; i < cells.count; i++) {
    if (!cells.alive[i]) continue;
    const agg = cells.aggression[i];
    totalAgg += agg;
    if (agg <= params.peacefulMax) peaceful++;
    else if (agg <= params.protectorMax) protector++;
    else aggressor++;
  }

  history.peaceful.push(peaceful);
  history.protector.push(protector);
  history.aggressor.push(aggressor);
  history.avgAgg.push(cells.count > 0 ? totalAgg / cells.count : 0);
  history.ticks.push(state.tick);

  if (history.peaceful.length > MAX_LENGTH) {
    history.peaceful.shift();
    history.protector.shift();
    history.aggressor.shift();
    history.avgAgg.shift();
    history.ticks.shift();
  }
}

/**
 * Отрисовывает график статистики: три линии популяций + средняя агрессия,
 * легенда, сетка. При hoverX !== null — tooltip с точными значениями.
 */
export function renderStats(
  ctx: CanvasRenderingContext2D,
  history: StatsHistory,
  hoverX: number | null,
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const pad = { top: 20, right: 10, bottom: 5, left: 5 };
  const pw = w - pad.left - pad.right;
  const ph = h - pad.top - pad.bottom;

  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, w, h);

  const len = history.peaceful.length;
  if (len < 2) {
    drawLegend(ctx, 0, 0);
    return;
  }

  // Сетка
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 0.5;
  for (let i = 1; i < 4; i++) {
    const y = pad.top + (i / 4) * ph;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
  }

  let maxPop = 1;
  for (let i = 0; i < len; i++) {
    maxPop = Math.max(maxPop, history.peaceful[i], history.protector[i], history.aggressor[i]);
  }

  drawCurve(ctx, history.peaceful, len, maxPop, w, h, pad, "hsl(120, 70%, 50%)", 1.5);
  drawCurve(ctx, history.protector, len, maxPop, w, h, pad, "hsl(240, 70%, 50%)", 1.5);
  drawCurve(ctx, history.aggressor, len, maxPop, w, h, pad, "hsl(0, 70%, 50%)", 1.5);

  // Средняя агрессия (шкала 0..100)
  drawCurve(ctx, history.avgAgg, len, 100, w, h, pad, "#fff", 1);

  drawLegend(ctx, history.avgAgg[len - 1],
    history.peaceful[len - 1] + history.protector[len - 1] + history.aggressor[len - 1]);

  // Подсказка при наведении
  if (hoverX !== null && len > 0) {
    const idx = Math.round((hoverX / w) * (len - 1));
    if (idx >= 0 && idx < len) {
      drawHover(ctx, history, idx, w, h, pad);
    }
  }
}

/** Рисует одну линию на графике по массиву значений */
function drawCurve(
  ctx: CanvasRenderingContext2D,
  data: number[],
  len: number,
  maxVal: number,
  w: number, h: number,
  pad: { top: number; right: number; bottom: number; left: number },
  color: string,
  lineWidth: number,
): void {
  const pw = w - pad.left - pad.right;
  const ph = h - pad.top - pad.bottom;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (let i = 0; i < len; i++) {
    const x = pad.left + (i / (len - 1)) * pw;
    const y = h - pad.bottom - (data[i] / maxVal) * ph;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/** Рисует легенду: цветные квадраты с подписями, средняя агрессия, общая численность */
function drawLegend(ctx: CanvasRenderingContext2D, avgAgg: number, total: number): void {
  const x = 10;
  let y = 10;

  ctx.font = "10px monospace";
  ctx.textBaseline = "middle";

  const items: [string, string, string][] = [
    ["#4c4", "зелёные", "мирные"],
    ["#44c", "синие", "защитники"],
    ["#c44", "красные", "агрессоры"],
  ];

  for (const [color, short, full] of items) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 3, 8, 8);
    ctx.fillStyle = "#aaa";
    ctx.fillText(short, x + 12, y);
    y += 14;
  }

  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y - 2, 8, 2);
  ctx.fillStyle = "#aaa";
  ctx.fillText(`средняя агрессия: ${avgAgg.toFixed(1)}`, x + 12, y);
  y += 14;
  ctx.fillText(`всего: ${total}`, x + 12, y);
}

/** Рисует tooltip при наведении: вертикальная линия + плашка со значениями */
function drawHover(
  ctx: CanvasRenderingContext2D,
  history: StatsHistory,
  idx: number,
  w: number, h: number,
  pad: { top: number; right: number; bottom: number; left: number },
): void {
  const pw = w - pad.left - pad.right;
  const x = pad.left + (idx / (history.peaceful.length - 1)) * pw;

  // Вертикальная линия
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x, pad.top);
  ctx.lineTo(x, h - pad.bottom);
  ctx.stroke();

  // Подсказка
  const values = [
    { label: "зелёные (мирные)", val: history.peaceful[idx], color: "#4c4" },
    { label: "синие (защитники)", val: history.protector[idx], color: "#44c" },
    { label: "красные (агрессоры)", val: history.aggressor[idx], color: "#c44" },
  ];

  ctx.font = "11px monospace";
  const lineH = 14;
  const boxW = 180;
  const boxH = values.length * lineH + 8;
  let boxX = x + 8;
  let boxY = 4;
  if (boxX + boxW > w) boxX = x - boxW - 8;

  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.textBaseline = "middle";
  for (let i = 0; i < values.length; i++) {
    const ty = boxY + 8 + i * lineH;
    ctx.fillStyle = values[i].color;
    ctx.fillRect(boxX + 4, ty - 3, 8, 8);
    ctx.fillStyle = "#ccc";
    ctx.fillText(`${values[i].label}: ${values[i].val}`, boxX + 16, ty);
  }
}
