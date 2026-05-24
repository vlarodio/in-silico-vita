/**
 * Двумерная сетка ресурсов («пастбища»).
 * data — одномерный массив, layout row-major.
 * Ширина и высота в ячейках сетки (не пикселях).
 */
export interface ResourceGrid {
  data: Float64Array;
  width: number;
  height: number;
}

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
  /** Текущий запас энергии */
  energy: Float64Array;
  /** Возраст в тактах */
  age: Uint32Array;
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

  // ─── Энергия ───
  /** Базовый расход энергии за такт (метаболизм) */
  energyCost: number;
  /** Расход энергии за один шаг движения */
  energyMoveCost: number;
  /** Базовая энергия, получаемая из среды (масштабируется через efficiency) */
  envBaseEnergy: number;
  /** Начальный запас энергии каждой клетки */
  initialEnergy: number;

  // ─── Эффективность питания из среды ───
  /** Верхняя граница мирного поведения (aggression ≤ peacefulMax → мирная) */
  peacefulMax: number;
  /** Верхняя граница защитного поведения (aggression ≤ protectorMax → защитник) */
  protectorMax: number;
  /** Множитель эффективности питания для мирных клеток */
  peacefulEfficiency: number;
  /** Множитель эффективности питания для защитников */
  protectorEfficiency: number;
  /** Множитель эффективности питания для агрессоров */
  aggressorEfficiency: number;

  // ─── Ресурсная сетка ───
  /** Количество ячеек сетки ресурсов по горизонтали */
  resourceGridWidth: number;
  /** Количество ячеек сетки ресурсов по вертикали */
  resourceGridHeight: number;
  /** Скорость логистического восстановления ресурса за такт */
  resourceRegenRate: number;
  /** Ёмкость ячейки ресурса (максимальное значение) */
  resourceK: number;

  // ─── Движение ───
  /** Скорость клетки (единиц мира за такт) */
  baseSpeed: number;
  /** Верхняя граница слайдера количества клеток; она же задаёт capacity хранилища */
  maxCellCount: number;
}

export interface SimState {
  params: SimParams;
  cells: CellStore;
  /** Ресурсная сетка («пастбища») */
  resources: ResourceGrid;
  /** Номер текущего такта */
  tick: number;
  /** Запущена ли симуляция */
  running: boolean;
  /** Множитель скорости (тактов за кадр) */
  speed: number;
}

/**
 * Возвращает коэффициент эффективности питания клетки из среды.
 * Мирные питаются лучше всех (1.0), агрессоры — хуже всех (0.4).
 */
export function efficiency(aggression: number, p: SimParams): number {
  if (aggression <= p.peacefulMax) return p.peacefulEfficiency;
  if (aggression <= p.protectorMax) return p.protectorEfficiency;
  return p.aggressorEfficiency;
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
