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
 * @returns Объект состояния симуляции
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

  // Основной canvas
  const canvas = document.createElement("canvas");
  canvas.width = params.worldWidth;
  canvas.height = params.worldHeight;
  canvas.style.display = "block";
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d")!;

  // Canvas для графика статистики
  const statsCanvas = document.createElement("canvas");
  statsCanvas.width = params.worldWidth;
  statsCanvas.height = 100;
  statsCanvas.style.display = "block";
  statsCanvas.style.marginTop = "4px";
  container.appendChild(statsCanvas);

  const statsCtx = statsCanvas.getContext("2d")!;

  createControls(container, state, (targetCount) => {
    setCellCount(state.cells, targetCount, params);
  });

  startLoop(state, ctx, statsCtx);
  return state;
}
