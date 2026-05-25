import type { CellStore, SimParams } from "./types";

/**
 * Внешние возмущения — «инфекции».
 * Раз в infectionInterval тактов infectionCount случайных клеток
 * получают скачок aggression на infectionDelta (обрезается в [0, 100]).
 * Моделирует горизонтальный перенос генов или вирусную трансформацию.
 */
export function applyInfections(
  cells: CellStore,
  params: SimParams,
  tick: number,
): void {
  if (params.infectionInterval <= 0) return;
  if (tick % params.infectionInterval !== 0) return;

  for (let i = 0; i < params.infectionCount && cells.count > 0; i++) {
    const idx = Math.floor(Math.random() * cells.count);
    let va = cells.aggression[idx] + params.infectionDelta;
    if (va > 100) va = 100;
    cells.aggression[idx] = va;
  }
}
