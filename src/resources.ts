import type { ResourceGrid } from "./types";

/**
 * Создаёт ресурсную сетку заданного размера.
 * Все ячейки инициализируются значением capacity (максимум ресурса).
 */
export function createResourceGrid(
  width: number,
  height: number,
  capacity: number,
): ResourceGrid {
  const data = new Float64Array(width * height);
  data.fill(capacity);
  return { data, width, height };
}

/**
 * Возвращает индекс в одномерном массиве ресурсной сетки
 * для заданных мировых координат клетки.
 */
export function gridIndex(
  grid: ResourceGrid,
  x: number,
  y: number,
  worldWidth: number,
  worldHeight: number,
): number {
  const gx = Math.floor((x / worldWidth) * grid.width);
  const gy = Math.floor((y / worldHeight) * grid.height);
  return gy * grid.width + gx;
}

/**
 * Пытается потребить amount ресурса из ячейки, в которой находится клетка.
 * Возвращает реально полученное количество (не больше доступного).
 * Если клетка вышла за границы мира (не должно случаться при wrap),
 * запрос игнорируется и возвращается 0.
 */
export function consume(
  grid: ResourceGrid,
  x: number,
  y: number,
  amount: number,
  worldWidth: number,
  worldHeight: number,
): number {
  const idx = gridIndex(grid, x, y, worldWidth, worldHeight);
  const available = grid.data[idx];
  const taken = Math.min(amount, available);
  grid.data[idx] -= taken;
  return taken;
}

/**
 * Логистическое восстановление всех ячеек ресурсной сетки.
 * resource += rate * (1 - resource/K), но не выше K.
 */
export function regen(grid: ResourceGrid, rate: number, k: number): void {
  for (let i = 0; i < grid.data.length; i++) {
    grid.data[i] += rate * (1 - grid.data[i] / k);
    if (grid.data[i] > k) grid.data[i] = k;
  }
}
