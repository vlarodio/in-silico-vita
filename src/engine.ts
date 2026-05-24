import type { SimState } from "./types";
import { moveCells } from "./movement";
import { metabolize } from "./metabolism";
import { regen } from "./resources";
import { render, createResourceImage } from "./render";

/**
 * Запускает бесконечный цикл симуляции через requestAnimationFrame.
 * Каждый кадр:
 *   1. Если running — делает speed тактов:
 *      движение → метаболизм → реген ресурсов
 *   2. Отрисовывает текущее состояние
 *   3. Планирует следующий кадр
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
        state.tick++;
      }
    }
    render(ctx, state, resourceImg);
    requestAnimationFrame(tick);
  }
  tick();
}
