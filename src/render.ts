import type { SimState } from "./types";

/** Радиус кружка клетки в пикселях */
const CELL_RADIUS = 2;

/** Цвет фона canvas */
const BG_COLOR = "#111";

/**
 * Отрисовывает один кадр симуляции на переданном 2D-контексте.
 *   1. Заливает фон цветом BG_COLOR
 *   2. Для каждой живой клетки рисует закрашенный кружок
 *      Цвет: HSL, hue = 120 × (1 − aggression / 100)
 *            0 → зелёный, 100 → красный
 */
export function render(ctx: CanvasRenderingContext2D, state: SimState): void {
  const w = state.params.worldWidth;
  const h = state.params.worldHeight;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  const { cells } = state;
  for (let i = 0; i < cells.count; i++) {
    if (!cells.alive[i]) continue;
    const hue = 120 * (1 - cells.aggression[i] / 100);
    ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
    ctx.beginPath();
    ctx.arc(cells.x[i], cells.y[i], CELL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}
