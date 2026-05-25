import type { CellStore, SimParams } from "./types";

/**
 * Строит пространственную сетку для быстрого поиска соседей.
 * Мир разбивается на квадратные ячейки со стороной cellSize = max(attackRadius, taxRadius).
 * Ключ = gy * gridW + gx, значение = список индексов клеток в этой ячейке.
 * Перестраивается каждый такт, сложность O(n).
 */
export function buildSpatialGrid(
  cells: CellStore,
  params: SimParams,
): Map<number, number[]> {
  const cellSize = Math.max(params.attackRadius, params.taxRadius);
  const gridW = Math.ceil(params.worldWidth / cellSize);
  const gridH = Math.ceil(params.worldHeight / cellSize);
  const grid: Map<number, number[]> = new Map();

  for (let i = 0; i < cells.count; i++) {
    if (!cells.alive[i]) continue;
    const gx = Math.floor(cells.x[i] / cellSize);
    const gy = Math.floor(cells.y[i] / cellSize);
    const key = wrapGridKey(gx, gy, gridW, gridH);
    const bucket = grid.get(key);
    if (bucket) bucket.push(i);
    else grid.set(key, [i]);
  }

  return grid;
}

/**
 * Собирает индексы всех клеток в пределах радиуса от заданной.
 * Проверяет текущую и 8 соседних ячеек сетки, затем фильтрует по тороидальному расстоянию.
 */
export function findNeighbors(
  cells: CellStore,
  grid: Map<number, number[]>,
  cellIdx: number,
  radius: number,
  params: SimParams,
  cellSize: number,
): number[] {
  const { worldWidth, worldHeight } = params;
  const gridW = Math.ceil(worldWidth / cellSize);
  const gridH = Math.ceil(worldHeight / cellSize);

  const cx = cells.x[cellIdx];
  const cy = cells.y[cellIdx];
  const gx0 = Math.floor(cx / cellSize);
  const gy0 = Math.floor(cy / cellSize);

  const result: number[] = [];

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const key = wrapGridKey(gx0 + dx, gy0 + dy, gridW, gridH);
      const bucket = grid.get(key);
      if (!bucket) continue;

      for (const otherIdx of bucket) {
        if (otherIdx === cellIdx) continue;
        if (!cells.alive[otherIdx]) continue;
        if (toroidalDist(cx, cy, cells.x[otherIdx], cells.y[otherIdx], worldWidth, worldHeight) <= radius) {
          result.push(otherIdx);
        }
      }
    }
  }

  return result;
}

export function toroidalDist(
  x1: number, y1: number,
  x2: number, y2: number,
  worldWidth: number, worldHeight: number,
): number {
  let dx = Math.abs(x2 - x1);
  let dy = Math.abs(y2 - y1);
  if (dx > worldWidth / 2) dx = worldWidth - dx;
  if (dy > worldHeight / 2) dy = worldHeight - dy;
  return Math.sqrt(dx * dx + dy * dy);
}

function wrapGridKey(gx: number, gy: number, gridW: number, gridH: number): number {
  gx = ((gx % gridW) + gridW) % gridW;
  gy = ((gy % gridH) + gridH) % gridH;
  return gy * gridW + gx;
}
