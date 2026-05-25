import type { SimState, SimParams } from "./types";
import { DEFAULT_PARAMS } from "./params";
import { createCellStore, spawnCells, killRandomCells } from "./cellstore";
import { createResourceGrid } from "./resources";
import { startLoop } from "./engine";
import { createControls } from "./ui";

/**
 * Точка входа пакета.
 * Создаёт canvas, ресурсную сетку, клетки, панель управления и
 * запускает главный цикл симуляции внутри переданного HTML-элемента.
 *
 * @param container — DOM-элемент, в который монтируются canvas и управление
 * @param options   — частичное переопределение параметров (сливается с DEFAULT_PARAMS)
 * @returns Объект состояния симуляции (можно использовать для внешнего управления)
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
    paused: false,
    speed: 1,
    resetRequested: false,
  };

  spawnInitial(cells, params);

  const canvas = document.createElement("canvas");
  canvas.width = params.worldWidth;
  canvas.height = params.worldHeight;
  canvas.style.display = "block";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;

  const statsCanvas = document.createElement("canvas");
  statsCanvas.width = params.worldWidth;
  statsCanvas.height = 100;
  statsCanvas.style.display = "block";
  statsCanvas.style.marginTop = "4px";
  statsCanvas.style.cursor = "crosshair";
  container.appendChild(statsCanvas);
  const statsCtx = statsCanvas.getContext("2d")!;

  const controls = createControls(
    container, state,
    (peaceful, protector, aggressor) => {
      // Start
      state.running = false;
      state.paused = false;
      state.tick = 0;
      killRandomCells(cells, cells.count);
      spawnCells(cells, peaceful, 0, params);
      spawnCells(cells, protector, 50, params);
      spawnCells(cells, aggressor, 85, params);
      state.resetRequested = true;
      state.running = true;
    },
    () => {
      // Stop: сброс на значения по умолчанию
      state.running = false;
      state.paused = false;
      state.tick = 0;
      killRandomCells(cells, cells.count);
      spawnInitial(cells, DEFAULT_PARAMS);
      state.params.initialPeacefulCount = DEFAULT_PARAMS.initialPeacefulCount;
      state.params.initialProtectorCount = DEFAULT_PARAMS.initialProtectorCount;
      state.params.initialAggressorCount = DEFAULT_PARAMS.initialAggressorCount;
      state.resetRequested = true;
    },
  );

  startLoop(state, ctx, statsCanvas, statsCtx,
    (p, r, a) => controls.updateLiveCounts(p, r, a));

  return state;
}

function spawnInitial(cells: ReturnType<typeof createCellStore>, params: SimParams): void {
  spawnCells(cells, params.initialPeacefulCount, 0, params);
  spawnCells(cells, params.initialProtectorCount, 50, params);
  spawnCells(cells, params.initialAggressorCount, 85, params);
}
