import type { SimState } from "./types";
import { moveCells } from "./movement";
import { metabolize } from "./metabolism";
import { regen } from "./resources";
import { handleInteractions, divideCells } from "./behavior";
import { applyInfections } from "./events";
import { render, createResourceImage } from "./render";
import { collectStats, renderStats, createStatsHistory, type StatsHistory } from "./stats";

/**
 * Запускает главный цикл симуляции через requestAnimationFrame.
 *
 * Каждый кадр (если running && !paused) выполняет speed тактов:
 * движение → метаболизм → реген ресурсов → взаимодействия → деление →
 * инфекции → сбор статистики. Затем вызывает onFrame для обновления UI
 * и отрисовывает основной canvas и график.
 */
export function startLoop(
  state: SimState,
  ctx: CanvasRenderingContext2D,
  statsCanvas: HTMLCanvasElement,
  statsCtx: CanvasRenderingContext2D,
  onFrame: (peaceful: number, protector: number, aggressor: number) => void,
): void {
  const { worldWidth, worldHeight } = state.params;
  const resourceImg = createResourceImage(state.resources, worldWidth, worldHeight);
  const statsHistory = createStatsHistory();

  let hoverX: number | null = null;

  statsCanvas.addEventListener("mousemove", (e) => {
    const rect = statsCanvas.getBoundingClientRect();
    hoverX = e.clientX - rect.left;
  });
  statsCanvas.addEventListener("mouseleave", () => {
    hoverX = null;
  });

  let livePeaceful = 0, liveProtector = 0, liveAggressor = 0;

  /** Один кадр симуляции: сброс, такты, сбор статистики, рендер */
  function tick() {
    if (state.resetRequested) {
      statsHistory.ticks.length = 0;
      statsHistory.peaceful.length = 0;
      statsHistory.protector.length = 0;
      statsHistory.aggressor.length = 0;
      statsHistory.avgAgg.length = 0;
      state.resources.data.fill(state.params.resourceK);
      state.resetRequested = false;
    }

    if (state.running && !state.paused) {
      for (let s = 0; s < state.speed; s++) {
        moveCells(state.cells, state.resources, state.params);
        metabolize(state.cells, state.resources, state.params);
        regen(state.resources, state.params.resourceRegenRate, state.params.resourceK);
        handleInteractions(state.cells, state.params);
        divideCells(state.cells, state.params);
        applyInfections(state.cells, state.params, state.tick);
        collectStats(statsHistory, state);
        state.tick++;
      }
      const last = statsHistory;
      if (last.peaceful.length > 0) {
        livePeaceful = last.peaceful[last.peaceful.length - 1];
        liveProtector = last.protector[last.protector.length - 1];
        liveAggressor = last.aggressor[last.aggressor.length - 1];
      }
    }

    onFrame(livePeaceful, liveProtector, liveAggressor);
    render(ctx, state, resourceImg);
    renderStats(statsCtx, statsHistory, hoverX);
    requestAnimationFrame(tick);
  }
  tick();
}
