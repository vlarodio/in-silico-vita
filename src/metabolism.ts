import type { CellStore, ResourceGrid, SimParams } from "./types";
import { efficiency } from "./types";
import { consume } from "./resources";
import { killCell } from "./cellstore";

/**
 * Один такт метаболизма для всех живых клеток:
 *   1. Вычитает energyCost (базовый обмен)
 *   2. Пытается потребить envBaseEnergy * efficiency(aggression) из ресурсной сетки
 *   3. Увеличивает возраст на 1
 *   4. Клетки с энергией ≤ 0 убиваются (swap-with-last)
 */
export function metabolize(
  cells: CellStore,
  resources: ResourceGrid,
  params: SimParams,
): void {
  const { energyCost, envBaseEnergy, worldWidth, worldHeight } = params;

  for (let i = 0; i < cells.count; i++) {
    if (!cells.alive[i]) continue;

    cells.energy[i] -= energyCost;

    const eff = efficiency(cells.aggression[i], params);
    const desired = envBaseEnergy * eff;
    const got = consume(resources, cells.x[i], cells.y[i], desired, worldWidth, worldHeight);
    cells.energy[i] += got;

    cells.age[i]++;

    if (cells.energy[i] <= 0) {
      killCell(cells, i);
      i--; // обработать клетку, занявшую место убитой
    }
  }
}
