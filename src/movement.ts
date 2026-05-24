import type { CellStore, SimParams } from "./types";
import { wrap } from "./types";

/**
 * Перемещает каждую живую клетку в случайном направлении
 * на расстояние baseSpeed и вычитает energyMoveCost.
 */
export function moveCells(cells: CellStore, params: SimParams): void {
  const { worldWidth, worldHeight, baseSpeed, energyMoveCost } = params;
  for (let i = 0; i < cells.count; i++) {
    if (!cells.alive[i]) continue;
    const angle = Math.random() * Math.PI * 2;
    const dx = Math.cos(angle) * baseSpeed;
    const dy = Math.sin(angle) * baseSpeed;
    cells.x[i] = wrap(worldWidth, cells.x[i] + dx);
    cells.y[i] = wrap(worldHeight, cells.y[i] + dy);
    cells.energy[i] -= energyMoveCost;
  }
}
