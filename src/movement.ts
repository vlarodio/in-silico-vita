import type { CellStore, SimParams } from "./types";
import { wrap } from "./types";

/**
 * Перемещает каждую живую клетку в случайном направлении
 * на расстояние baseSpeed. Для каждой клетки:
 *   1. Выбирается случайный угол [0, 2π)
 *   2. Вычисляется смещение (cos(θ)·speed, sin(θ)·speed)
 *   3. Координата заворачивается по тору через wrap()
 */
export function moveCells(cells: CellStore, params: SimParams): void {
  const { worldWidth, worldHeight, baseSpeed } = params;
  for (let i = 0; i < cells.count; i++) {
    if (!cells.alive[i]) continue;
    const angle = Math.random() * Math.PI * 2;
    const dx = Math.cos(angle) * baseSpeed;
    const dy = Math.sin(angle) * baseSpeed;
    cells.x[i] = wrap(worldWidth, cells.x[i] + dx);
    cells.y[i] = wrap(worldHeight, cells.y[i] + dy);
  }
}
