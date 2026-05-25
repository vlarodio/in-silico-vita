import type { SimState } from "./types";
import { moveCells } from "./movement";
import { metabolize } from "./metabolism";
import { regen } from "./resources";
import { handleInteractions, divideCells } from "./behavior";
import { applyInfections } from "./events";
import { render, createResourceImage } from "./render";

/**
 * Запускает бесконечный цикл симуляции через requestAnimationFrame.
 * Каждый кадр (speed тактов):
 *   1. Движение
 *   2. Метаболизм (+ смерть от голода)
 *   3. Реген ресурсов
 *   4. Взаимодействия (налог + атаки)
 *   5. Деление (размножение + мутации)
 *   6. Инфекции (по расписанию)
 *   7. Рендер
 */
export function startLoop(state: SimState, ctx: CanvasRenderingContext2D): void {
  const { worldWidth, worldHeight } = state.params;
  const resourceImg = createResourceImage(state.resources, worldWidth, worldHeight);

  function tick() {
    if (state.running) {
      for (let s = 0; s < state.speed; s++) {
        moveCells(state.cells, state.params);
        metabolize(state.cells, state.resources, state.params);
        regen(state.resources, state.params.resourceRegenRate, state.params.resourceK);
        handleInteractions(state.cells, state.params);
        divideCells(state.cells, state.params);
        applyInfections(state.cells, state.params, state.tick);
        state.tick++;
      }
    }
    render(ctx, state, resourceImg);
    requestAnimationFrame(tick);
  }
  tick();
}
