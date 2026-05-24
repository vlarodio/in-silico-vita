import type { SimState } from "./types";
import { moveCells } from "./movement";
import { render } from "./render";

/**
 * Запускает бесконечный цикл симуляции через requestAnimationFrame.
 * Каждый кадр:
 *   1. Если running — делает speed тактов движения (moveCells + tick++)
 *   2. Отрисовывает текущее состояние (render)
 *   3. Планирует следующий кадр
 */
export function startLoop(state: SimState, ctx: CanvasRenderingContext2D): void {
  function tick() {
    if (state.running) {
      for (let s = 0; s < state.speed; s++) {
        moveCells(state.cells, state.params);
        state.tick++;
      }
    }
    render(ctx, state);
    requestAnimationFrame(tick);
  }
  tick();
}
