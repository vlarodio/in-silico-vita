import type { SimState } from "./types";

const MAX_LENGTH = 400;

export interface StatsHistory {
  ticks: number[];
  peaceful: number[];
  protector: number[];
  aggressor: number[];
  avgAgg: number[];
}

export function createStatsHistory(): StatsHistory {
  return { ticks: [], peaceful: [], protector: [], aggressor: [], avgAgg: [] };
}

/**
 * Собирает срез статистики за текущий такт:
 * численность трёх групп (мирные/защитники/агрессоры) и средняя агрессия.
 * Хранит последние MAX_LENGTH записей.
 */
export function collectStats(history: StatsHistory, state: SimState): void {
  const { cells, params, tick } = state;
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
  history.ticks.push(tick);

  if (history.peaceful.length > MAX_LENGTH) {
    history.peaceful.shift();
    history.protector.shift();
    history.aggressor.shift();
    history.avgAgg.shift();
    history.ticks.shift();
  }
}

/**
 * Отрисовывает линейный график на переданном canvas-контексте.
 * Три цветных линии для групп + белая пунктирная для средней агрессии.
 */
export function renderStats(
  ctx: CanvasRenderingContext2D,
  history: StatsHistory,
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  // Фон
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, w, h);

  const len = history.peaceful.length;
  if (len < 2) return;

  // Сетка
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 0.5;
  for (let i = 1; i < 4; i++) {
    const y = (i / 4) * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Максимум для масштаба по Y
  let maxPop = 1;
  for (let i = 0; i < len; i++) {
    maxPop = Math.max(maxPop, history.peaceful[i], history.protector[i], history.aggressor[i]);
  }

  // Линии популяций
  drawLine(ctx, history.peaceful, len, maxPop, w, h, "hsl(120, 70%, 50%)", 1.5);
  drawLine(ctx, history.protector, len, maxPop, w, h, "hsl(240, 70%, 50%)", 1.5);
  drawLine(ctx, history.aggressor, len, maxPop, w, h, "hsl(0, 70%, 50%)", 1.5);

  // Средняя агрессия (шкала 0..100, правая ось не рисуем — просто линия)
  drawLine(ctx, history.avgAgg, len, 100, w, h, "#fff", 1);
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  data: number[],
  len: number,
  maxVal: number,
  w: number,
  h: number,
  color: string,
  lineWidth: number,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (let i = 0; i < len; i++) {
    const x = (i / (len - 1)) * w;
    const y = h - 5 - (data[i] / maxVal) * (h - 10);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
