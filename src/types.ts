/**
 * Плоское хранилище данных всех клеток.
 *
 * Все массивы выделяются сразу фиксированной длины capacity — это
 * максимальное число клеток, которое может существовать одновременно.
 * Реальная популяция — count штук, они занимают первые count слотов.
 * Когда клетка умирает, alive[i] = 0, слот помечается свободным.
 * При делении новая клетка занимает первый свободный слот.
 * Если свободных нет — деление не происходит.
 */
export interface CellStore {
  x: Float64Array;
  y: Float64Array;
  /** Ген агрессивности, целое число 0..100 */
  aggression: Uint8Array;
  /** 1 — жива, 0 — мертва (слот свободен) */
  alive: Uint8Array;
  /** Общий размер выделенных массивов (максимальная ёмкость) */
  capacity: number;
  /** Текущее количество живых клеток (count ≤ capacity) */
  count: number;
}

/** Параметры симуляции */
export interface SimParams {
  /** Ширина мира (совпадает с шириной canvas) */
  worldWidth: number;
  /** Высота мира (совпадает с высотой canvas) */
  worldHeight: number;
  /** Количество клеток при старте */
  initialCellCount: number;
  /** Начальное значение агрессивности (0 — мирная) */
  initialAggression: number;
  /** Скорость клетки (единиц мира за такт) */
  baseSpeed: number;
  /** Верхняя граница слайдера количества клеток; она же задаёт capacity хранилища */
  maxCellCount: number;
}

/** Рантайм-состояние симуляции */
export interface SimState {
  params: SimParams;
  cells: CellStore;
  /** Номер текущего такта */
  tick: number;
  /** Запущена ли симуляция */
  running: boolean;
  /** Множитель скорости (тактов за кадр) */
  speed: number;
}

/**
 * Заворачивает координату по тору:
 * выход за границу мира возвращает на противоположную сторону.
 */
export function wrap(worldSize: number, coord: number): number {
  if (coord < 0) return coord + worldSize;
  if (coord >= worldSize) return coord - worldSize;
  return coord;
}
