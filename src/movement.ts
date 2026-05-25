import type { CellStore, SimParams } from "./types";
import { wrap } from "./types";
import { buildSpatialGrid, findNeighbors, toroidalDist } from "./grid";

const CHEMOTAXIS_BIAS = 0.3; // вес направления к цели (0..1)

/**
 * Перемещает каждую живую клетку и вычитает energyMoveCost.
 * Направление: случайное, но с хемотаксисом для защитников и агрессоров.
 *
 * Агрессоры (aggression > protectorMax) смещаются к ближайшей клетке с aggression < 100.
 * Защитники (peacefulMax < aggression ≤ protectorMax) — к ближайшему агрессору (> protectorMax).
 * Мирные движутся чисто случайно.
 */
export function moveCells(cells: CellStore, params: SimParams): void {
  const { worldWidth, worldHeight, baseSpeed, energyMoveCost } = params;
  const grid = params.chemotaxisRadius > 0
    ? buildSpatialGrid(cells, params)
    : null;

  for (let i = 0; i < cells.count; i++) {
    if (!cells.alive[i]) continue;
    const agg = cells.aggression[i];

    let angle = Math.random() * Math.PI * 2;

    if (grid) {
      const target = findChemotaxisTarget(cells, grid, i, agg, params);
      if (target !== -1) {
        angle = biasAngle(angle, cells.x[i], cells.y[i], cells.x[target], cells.y[target]);
      }
    }

    const dx = Math.cos(angle) * baseSpeed;
    const dy = Math.sin(angle) * baseSpeed;
    cells.x[i] = wrap(worldWidth, cells.x[i] + dx);
    cells.y[i] = wrap(worldHeight, cells.y[i] + dy);
    cells.energy[i] -= energyMoveCost;
  }
}

/**
 * Ищет цель для хемотаксиса в радиусе chemotaxisRadius.
 * Возвращает индекс ближайшей подходящей клетки или -1.
 */
function findChemotaxisTarget(
  cells: CellStore,
  grid: Map<number, number[]>,
  idx: number,
  aggression: number,
  params: SimParams,
): number {
  const { chemotaxisRadius, peacefulMax, protectorMax } = params;
  const cellSize = Math.max(params.attackRadius, params.taxRadius);
  const neighbors = findNeighbors(cells, grid, idx, chemotaxisRadius, params, cellSize);

  let bestIdx = -1;
  let bestDist = Infinity;

  for (const ni of neighbors) {
    const na = cells.aggression[ni];
    let valid = false;

    if (aggression > protectorMax) {
      // Агрессор → любая с aggression < 100
      valid = na < 100;
    } else if (aggression > peacefulMax) {
      // Защитник → агрессоры (> protectorMax)
      valid = na > protectorMax;
    }

    if (!valid) continue;

    const d = toroidalDist(
      cells.x[idx], cells.y[idx],
      cells.x[ni], cells.y[ni],
      params.worldWidth, params.worldHeight,
    );
    if (d < bestDist) {
      bestDist = d;
      bestIdx = ni;
    }
  }

  return bestIdx;
}

/**
 * Смешивает случайный угол с направлением на цель.
 * CHEMOTAXIS_BIAS доля идёт к цели, остальное — случайность.
 */
function biasAngle(
  randomAngle: number,
  x: number, y: number,
  tx: number, ty: number,
): number {
  const targetAngle = Math.atan2(ty - y, tx - x);
  let diff = targetAngle - randomAngle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return randomAngle + diff * CHEMOTAXIS_BIAS;
}
