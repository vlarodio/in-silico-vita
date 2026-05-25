import type { CellStore, SimParams } from "./types";

/**
 * Создаёт пустое хранилище клеток.
 * Все типизированные массивы выделяются сразу на capacity элементов
 * и больше не переаллоцируются — это верхняя граница популяции.
 */
export function createCellStore(capacity: number): CellStore {
  return {
    x: new Float64Array(capacity),
    y: new Float64Array(capacity),
    aggression: new Uint8Array(capacity),
    energy: new Float64Array(capacity),
    age: new Uint32Array(capacity),
    alive: new Uint8Array(capacity),
    capacity,
    count: 0,
  };
}

/**
 * Добавляет count новых клеток с заданной агрессивностью.
 * Координаты случайные в пределах мира.
 * Энергия и возраст берутся из params.
 */
export function spawnCells(
  store: CellStore,
  count: number,
  aggression: number,
  params: SimParams,
): void {
  const limit = Math.min(count, store.capacity - store.count);
  for (let i = 0; i < limit; i++) {
    const idx = store.count;
    store.x[idx] = Math.random() * params.worldWidth;
    store.y[idx] = Math.random() * params.worldHeight;
    store.aggression[idx] = aggression;
    store.energy[idx] = params.initialEnergy;
    store.age[idx] = 0;
    store.alive[idx] = 1;
    store.count++;
  }
}

/**
 * Убивает клетку по индексу.
 * Мёртвая клетка меняется местами с последней живой в диапазоне [0..count),
 * и count уменьшается на 1. Активный диапазон остаётся непрерывным.
 */
export function killCell(store: CellStore, idx: number): void {
  if (idx >= store.count || store.alive[idx] === 0) return;
  const last = store.count - 1;
  if (idx !== last) {
    store.x[idx] = store.x[last];
    store.y[idx] = store.y[last];
    store.aggression[idx] = store.aggression[last];
    store.energy[idx] = store.energy[last];
    store.age[idx] = store.age[last];
    store.alive[idx] = 1;
  }
  store.alive[last] = 0;
  store.count--;
}

/**
 * Убивает n случайных живых клеток.
 * Каждая жертва выбирается независимо (random из текущего count),
 * возможны повторные попадания в одну и ту же клетку.
 */
export function killRandomCells(store: CellStore, n: number): void {
  for (let i = 0; i < n && store.count > 0; i++) {
    const idx = Math.floor(Math.random() * store.count);
    killCell(store, idx);
  }
}

/**
 * Приводит количество живых клеток к target.
 * Новые клетки создаются с нулевой агрессивностью.
 */
export function setCellCount(
  store: CellStore,
  target: number,
  params: SimParams,
): void {
  target = Math.max(0, Math.min(target, store.capacity));
  if (target === store.count) return;
  if (target > store.count) {
    spawnCells(store, target - store.count, 0, params);
  } else {
    killRandomCells(store, store.count - target);
  }
}
