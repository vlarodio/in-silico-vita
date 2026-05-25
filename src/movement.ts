import type { CellStore, ResourceGrid, SimParams } from "./types";
import { wrap } from "./types";
import { buildSpatialGrid, findNeighbors, toroidalDist } from "./grid";

const CHEMOTAXIS_BIAS = 0.3;

/**
 * Перемещает каждую живую клетку и вычитает energyMoveCost.
 *
 * Мирные (aggression ≤ peacefulMax) — хемотаксис к самой богатой ресурсной ячейке.
 * Защитники (peacefulMax < aggression ≤ protectorMax) — хемотаксис к ближайшему агрессору.
 * Агрессоры (aggression > protectorMax) — хемотаксис к ближайшей жертве (aggression < 100).
 */
export function moveCells(
  cells: CellStore,
  resources: ResourceGrid,
  params: SimParams,
): void {
  const { worldWidth, worldHeight, baseSpeed, energyMoveCost } = params;
  const grid = params.chemotaxisRadius > 0
    ? buildSpatialGrid(cells, params)
    : null;

  for (let i = 0; i < cells.count; i++) {
    if (!cells.alive[i]) continue;
    const agg = cells.aggression[i];

    let angle = Math.random() * Math.PI * 2;

    if (agg <= params.peacefulMax) {
      // Мирная → к богатейшей ресурсной ячейке
      const target = findRichestResourceCell(cells.x[i], cells.y[i], resources, params);
      if (target) {
        angle = biasAngle(angle, cells.x[i], cells.y[i], target.cx, target.cy);
      }
    } else if (grid) {
      // Защитник или агрессор → к клетке-цели
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
 * Находит координаты центра самой богатой ресурсной ячейки
 * в радиусе chemotaxisRadius от клетки. Возвращает null если вокруг пусто.
 */
function findRichestResourceCell(
  x: number, y: number,
  resources: ResourceGrid,
  params: SimParams,
): { cx: number; cy: number } | null {
  const cellW = params.worldWidth / params.resourceGridWidth;
  const cellH = params.worldHeight / params.resourceGridHeight;
  const range = Math.ceil(params.chemotaxisRadius / Math.min(cellW, cellH));

  const gx0 = Math.floor(x / cellW);
  const gy0 = Math.floor(y / cellH);

  let bestVal = -1;
  let bestGx = 0;
  let bestGy = 0;

  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      let gx = gx0 + dx;
      let gy = gy0 + dy;
      gx = ((gx % params.resourceGridWidth) + params.resourceGridWidth) % params.resourceGridWidth;
      gy = ((gy % params.resourceGridHeight) + params.resourceGridHeight) % params.resourceGridHeight;

      const val = resources.data[gy * params.resourceGridWidth + gx];
      const cellCx = (gx + 0.5) * cellW;
      const cellCy = (gy + 0.5) * cellH;
      const dist = toroidalDist(x, y, cellCx, cellCy, params.worldWidth, params.worldHeight);

      if (dist <= params.chemotaxisRadius && val > bestVal) {
        bestVal = val;
        bestGx = gx;
        bestGy = gy;
      }
    }
  }

  if (bestVal <= 0) return null;
  return {
    cx: (bestGx + 0.5) * cellW,
    cy: (bestGy + 0.5) * cellH,
  };
}

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
      valid = na < 100;
    } else if (aggression > peacefulMax) {
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
