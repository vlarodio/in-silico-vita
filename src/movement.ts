import type { CellStore, ResourceGrid, SimParams } from "./types";
import { wrap } from "./types";
import { buildSpatialGrid, findNeighbors, toroidalDist } from "./grid";

/** Вес хемотаксиса: 30% к цели, 70% случайно */
const CHEMOTAXIS_BIAS = 0.3;

/**
 * Перемещает каждую живую клетку и вычитает energyMoveCost.
 *
 * Мирные (зелёные): хемотаксис к богатейшей ресурсной ячейке.
 * Защитники (синие): 1) к агрессорам, 2) к мирным, 3) к еде.
 * Агрессоры (красные): 1) к мирным, 2) к еде, синих игнорируют.
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

  // Для каждой живой клетки: выбираем цель по приоритетам, смешиваем
  // случайное направление с направлением на цель, делаем шаг.
  for (let i = 0; i < cells.count; i++) {
    if (!cells.alive[i]) continue;
    const agg = cells.aggression[i];

    let angle = Math.random() * Math.PI * 2;
    let tx: number | null = null;
    let ty: number | null = null;

    if (agg <= params.peacefulMax) {
      // Зелёный: только к еде
      const food = findRichestResourceCell(cells.x[i], cells.y[i], resources, params);
      if (food) { tx = food.cx; ty = food.cy; }
    } else if (agg <= params.protectorMax && grid) {
      // Синий: приоритет 1) агрессор → 2) мирный → 3) еда
      const aggro = findNearestCellByPredicate(cells, grid, i,
        (a) => a > params.protectorMax, params);
      if (aggro !== -1) {
        tx = cells.x[aggro]; ty = cells.y[aggro];
      } else {
        const peaceful = findNearestCellByPredicate(cells, grid, i,
          (a) => a <= params.peacefulMax, params);
        if (peaceful !== -1) {
          tx = cells.x[peaceful]; ty = cells.y[peaceful];
        } else {
          const food = findRichestResourceCell(cells.x[i], cells.y[i], resources, params);
          if (food) { tx = food.cx; ty = food.cy; }
        }
      }
    } else if (grid) {
      // Красный: приоритет 1) мирный → 2) еда, синих игнорирует
      const peaceful = findNearestCellByPredicate(cells, grid, i,
        (a) => a <= params.peacefulMax, params);
      if (peaceful !== -1) {
        tx = cells.x[peaceful]; ty = cells.y[peaceful];
      } else {
        const food = findRichestResourceCell(cells.x[i], cells.y[i], resources, params);
        if (food) { tx = food.cx; ty = food.cy; }
      }
    }

    // Если цель найдена — сместить случайный угол в её сторону
    if (tx !== null) {
      angle = biasAngle(angle, cells.x[i], cells.y[i], tx, ty!);
    }

    const dx = Math.cos(angle) * baseSpeed;
    const dy = Math.sin(angle) * baseSpeed;
    cells.x[i] = wrap(worldWidth, cells.x[i] + dx);
    cells.y[i] = wrap(worldHeight, cells.y[i] + dy);
    cells.energy[i] -= energyMoveCost;
  }
}

/**
 * Находит индекс ближайшей клетки в chemotaxisRadius,
 * удовлетворяющей предикату. Использует пространственную сетку
 * и тороидальное расстояние. Возвращает -1 если не найдено.
 */
function findNearestCellByPredicate(
  cells: CellStore,
  grid: Map<number, number[]>,
  idx: number,
  predicate: (aggression: number) => boolean,
  params: SimParams,
): number {
  const cellSize = Math.max(params.attackRadius, params.taxRadius);
  const neighbors = findNeighbors(cells, grid, idx, params.chemotaxisRadius, params, cellSize);

  let bestIdx = -1;
  let bestDist = Infinity;

  // Перебор соседей: фильтр по предикату, выбор ближайшего
  for (const ni of neighbors) {
    if (!predicate(cells.aggression[ni])) continue;
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
 * Находит координаты центра самой богатой ресурсной ячейки в радиусе
 * chemotaxisRadius от точки (x,y). Возвращает null если ресурсов нет.
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

  // Обход ресурсных ячеек в окне [−range..+range] с тороидальным wrap.
  // Для каждой ячейки проверяется расстояние до её центра — если оно
  // в пределах chemotaxisRadius и ресурс выше текущего максимума,
  // запоминаем ячейку как лучшую.
  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      // тороидальный wrap индексов ячеек
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

/**
 * Смешивает случайный угол с направлением на цель.
 * Берёт долю CHEMOTAXIS_BIAS от угла к цели, остальное — случайность.
 * Корректно обрабатывает переход через ±π.
 */
function biasAngle(
  randomAngle: number,
  x: number, y: number,
  tx: number, ty: number,
): number {
  const targetAngle = Math.atan2(ty - y, tx - x);
  let diff = targetAngle - randomAngle;
  // нормализация разницы в [−π, π]
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return randomAngle + diff * CHEMOTAXIS_BIAS;
}
