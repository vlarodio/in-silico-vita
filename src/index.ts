import type { SimState, SimParams } from "./types";
import { DEFAULT_PARAMS } from "./params";
import { createCellStore, spawnCells, setCellCount } from "./cellstore";
import { createResourceGrid } from "./resources";
import { startLoop } from "./engine";
import { createControls } from "./ui";

/**
 * Точка входа пакета.
 * Создаёт и запускает симуляцию внутри переданного HTML-элемента.
 *
 * @param container — DOM-элемент, в который монтируются canvas и панель управления
 * @param options   — частичное переопределение параметров (объединяется с DEFAULT_PARAMS)
 * @returns Объект состояния симуляции (можно использовать для внешнего управления)
 *
 * Порядок инициализации:
 *   1. Параметры склеиваются из дефолтных и переданных
 *   2. Выделяется хранилище клеток и ресурсная сетка
 *   3. Спавнятся initialCellCount клеток в случайных позициях
 *   4. Создаётся canvas worldWidth × worldHeight и добавляется в container
 *   5. Монтируется панель управления (Start/Stop, Speed, Cells)
 *   6. Запускается игровой цикл через requestAnimationFrame
 */
export function createSimulation(
  container: HTMLElement,
  options?: Partial<SimParams>,
): SimState {
  const params: SimParams = { ...DEFAULT_PARAMS, ...options };
  const cells = createCellStore(params.maxCellCount);
  const resources = createResourceGrid(
    params.resourceGridWidth,
    params.resourceGridHeight,
    params.resourceK,
  );

  const state: SimState = {
    params,
    cells,
    resources,
    tick: 0,
    running: false,
    speed: 1,
  };

  spawnCells(cells, params.initialCellCount, params);

  const canvas = document.createElement("canvas");
  canvas.width = params.worldWidth;
  canvas.height = params.worldHeight;
  canvas.style.display = "block";
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d")!;

  createControls(container, state, (targetCount) => {
    setCellCount(state.cells, targetCount, params);
  });

  startLoop(state, ctx);
  return state;
}
