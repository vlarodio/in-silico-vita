import type { CellStore, SimParams } from "./types";
import { killCell } from "./cellstore";
import { buildSpatialGrid, findNeighbors, toroidalDist } from "./grid";

/**
 * Обрабатывает взаимодействия между клетками: налог и атаки.
 *
 * Мирные (aggression ≤ peacefulMax):
 *   находят ближайшего защитника в taxRadius и отдают taxRate % своей энергии.
 * Защитники (peacefulMax < aggression ≤ protectorMax):
 *   атакуют ближайшего агрессора (aggression > protectorMax) в attackRadius.
 *   При убийстве получают killProtectorReward.
 * Агрессоры (aggression > protectorMax):
 *   атакуют ближайшую клетку с aggression < 100 в attackRadius.
 *   При убийстве получают killAggressorReward.
 */
export function handleInteractions(
  cells: CellStore,
  params: SimParams,
): void {
  const {
    attackRadius, taxRadius, taxRate,
    killAggressorReward, killProtectorReward,
    peacefulMax, protectorMax,
    worldWidth, worldHeight,
  } = params;

  const grid = buildSpatialGrid(cells, params);
  const cellSize = Math.max(attackRadius, taxRadius);

  for (let i = 0; i < cells.count; i++) {
    if (!cells.alive[i]) continue;
    const agg = cells.aggression[i];

    if (agg <= peacefulMax) {
      // Мирная: платит налог ближайшему защитнику
      const target = findNearest(
        cells, grid, i, taxRadius, params, cellSize,
        (a) => a > peacefulMax && a <= protectorMax,
      );
      if (target !== -1) {
        const tax = cells.energy[i] * taxRate;
        cells.energy[i] -= tax;
        cells.energy[target] += tax;
      }
    } else if (agg <= protectorMax) {
      // Защитник: атакует ближайшего агрессора (> protectorMax)
      const target = findNearest(
        cells, grid, i, attackRadius, params, cellSize,
        (a) => a > protectorMax,
      );
      if (target !== -1) {
        const attackerWon = resolveFight(cells, i, target, killProtectorReward, killAggressorReward);
        if (!attackerWon) { i--; continue; }
        if (target <= i) i--;
      }
    } else {
      // Агрессор: атакует ближайшего с aggression < 100
      const target = findNearest(
        cells, grid, i, attackRadius, params, cellSize,
        (a) => a < 100,
      );
      if (target !== -1) {
        const targetAgg = cells.aggression[target];
        if (targetAgg <= protectorMax) {
          // Синий — бой по энергии
          const attackerWon = resolveFight(cells, i, target, killAggressorReward, killProtectorReward);
          if (!attackerWon) { i--; continue; }
        } else {
          // Зелёный или другой красный — мгновенное убийство
          cells.energy[i] += killAggressorReward;
          killCell(cells, target);
        }
        if (target <= i) i--;
      }
    }
  }
}

/**
 * Деление клеток.
 * Клетка делится, если energy ≥ energyDiv и age ≥ minDivisionAge.
 * Энергия делится пополам. Дочерняя aggression = родительская + мутация
 * (нормальное распределение N(0, σ), обрезка в [0, 100]).
 * Новая клетка появляется в той же точке, возраст 0.
 */
export function divideCells(cells: CellStore, params: SimParams): void {
  const { energyDiv, minDivisionAge, mutationSigma } = params;
  const limit = cells.count; // итерируем только тех, кто был до делений

  for (let i = 0; i < limit && cells.count < cells.capacity; i++) {
    if (!cells.alive[i]) continue;
    if (cells.energy[i] < energyDiv) continue;
    if (cells.age[i] < minDivisionAge) continue;

    const idx = cells.count;
    cells.x[idx] = cells.x[i];
    cells.y[idx] = cells.y[i];
    cells.energy[i] /= 2;
    cells.energy[idx] = cells.energy[i];
    cells.age[idx] = 0;
    cells.aggression[idx] = mutateAggression(cells.aggression[i], mutationSigma);
    cells.alive[idx] = 1;
    cells.count++;
  }
}

/**
 * Возвращает индекс ближайшей клетки в радиусе, удовлетворяющей предикату.
 * Если подходящих нет — возвращает -1.
 */
function findNearest(
  cells: CellStore,
  grid: Map<number, number[]>,
  cellIdx: number,
  radius: number,
  params: SimParams,
  cellSize: number,
  predicate: (aggression: number) => boolean,
): number {
  const { worldWidth, worldHeight } = params;
  const neighbors = findNeighbors(cells, grid, cellIdx, radius, params, cellSize);

  let bestIdx = -1;
  let bestDist = Infinity;

  for (const ni of neighbors) {
    if (!predicate(cells.aggression[ni])) continue;
    const d = toroidalDist(
      cells.x[cellIdx], cells.y[cellIdx],
      cells.x[ni], cells.y[ni],
      worldWidth, worldHeight,
    );
    if (d < bestDist) {
      bestDist = d;
      bestIdx = ni;
    }
  }

  return bestIdx;
}

/**
 * Разрешает бой между атакующим и целью по энергии:
 * проигрывает тот, у кого энергия меньше.
 * При равенстве побеждает атакующий.
 * Победитель получает награду, проигравший умирает.
 * Возвращает true если атакующий выжил.
 */
function resolveFight(
  cells: CellStore,
  attackerIdx: number,
  targetIdx: number,
  attackerReward: number,
  targetReward: number,
): boolean {
  if (cells.energy[attackerIdx] >= cells.energy[targetIdx]) {
    cells.energy[attackerIdx] += attackerReward;
    killCell(cells, targetIdx);
    return true;
  } else {
    cells.energy[targetIdx] += targetReward;
    killCell(cells, attackerIdx);
    return false;
  }
}

/**
 * Мутация агрессивности: normal(0, sigma), округление, обрезка в [0, 100].
 * Использует метод Бокса–Мюллера.
 */
function mutateAggression(parent: number, sigma: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  let child = parent + Math.round(z * sigma);
  if (child < 0) child = 0;
  if (child > 100) child = 100;
  return child;
}
