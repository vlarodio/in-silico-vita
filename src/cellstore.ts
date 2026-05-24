import type { CellStore } from "./types";

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
    alive: new Uint8Array(capacity),
    capacity,
    count: 0,
  };
}

/**
 * Добавляет count новых клеток в хранилище.
 * Новые клетки записываются начиная с индекса store.count
 * и занимают очередные слоты. Если свободного места не хватает,
 * создаётся столько, сколько влезает (limit = capacity − count).
 * Координаты случайные в пределах [0, worldWidth) × [0, worldHeight).
 */
export function spawnCells(
  store: CellStore,
  count: number,
  aggression: number,
  worldWidth: number,
  worldHeight: number,
): void {
  const limit = Math.min(count, store.capacity - store.count);
  for (let i = 0; i < limit; i++) {
    const idx = store.count;
    store.x[idx] = Math.random() * worldWidth;
    store.y[idx] = Math.random() * worldHeight;
    store.aggression[idx] = aggression;
    store.alive[idx] = 1;
    store.count++;
  }
}

/**
 * Убивает клетку по индексу.
 * Чтобы активный диапазон [0..count) оставался непрерывным
 * (все живые), мёртвая клетка меняется местами с последней живой
 * и count уменьшается на 1. Перестроения массивов не требуется.
 */
export function killCell(store: CellStore, idx: number): void {
  if (idx >= store.count || store.alive[idx] === 0) return;
  const last = store.count - 1;
  if (idx !== last) {
    store.x[idx] = store.x[last];
    store.y[idx] = store.y[last];
    store.aggression[idx] = store.aggression[last];
    store.alive[idx] = 1;
  }
  store.alive[last] = 0;
  store.count--;
}

/**
 * Убивает n случайных живых клеток.
 * Каждая жертва выбирается независимо (random из текущего count),
 * возможны повторные попадания в одну клетку — в этом случае
 * реально убитых будет меньше, чем n.
 */
export function killRandomCells(store: CellStore, n: number): void {
  for (let i = 0; i < n && store.count > 0; i++) {
    const idx = Math.floor(Math.random() * store.count);
    killCell(store, idx);
  }
}

/**
 * Приводит количество живых клеток к target.
 * Если target больше текущего — добавляет недостающие (aggression = 0).
 * Если меньше — убивает случайные.
 * Используется слайдером Cells в UI.
 */
export function setCellCount(
  store: CellStore,
  target: number,
  aggression: number,
  worldWidth: number,
  worldHeight: number,
): void {
  target = Math.max(0, Math.min(target, store.capacity));
  if (target === store.count) return;
  if (target > store.count) {
    spawnCells(store, target - store.count, aggression, worldWidth, worldHeight);
  } else {
    killRandomCells(store, store.count - target);
  }
}
