import type { SimState } from "./types";

/** Базовые стили панели управления */
const PANEL_STYLE = `
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  font-family: monospace;
  font-size: 13px;
  color: #ccc;
`;

/** Стили кнопки Start/Stop */
const BUTTON_STYLE = `
  padding: 4px 12px;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
`;

/**
 * Создаёт панель управления и добавляет её в container.
 * Панель содержит:
 *   - кнопку Start/Stop
 *   - слайдер Speed (1..10x)
 *   - слайдер Cells (0..maxCellCount), при изменении дёргает onCellCountChange
 */
export function createControls(
  container: HTMLElement,
  state: SimState,
  onCellCountChange: (count: number) => void,
): void {
  const panel = document.createElement("div");
  panel.setAttribute("style", PANEL_STYLE);

  // Кнопка Start/Stop — переключает running и меняет текст
  const btn = document.createElement("button");
  btn.textContent = state.running ? "Stop" : "Start";
  btn.setAttribute("style", BUTTON_STYLE);
  btn.onclick = () => {
    state.running = !state.running;
    btn.textContent = state.running ? "Stop" : "Start";
  };
  panel.appendChild(btn);

  const speedGroup = speedControl(state);
  panel.appendChild(speedGroup);

  const countGroup = countControl(state, onCellCountChange);
  panel.appendChild(countGroup);

  container.appendChild(panel);
}

/**
 * Создаёт элемент управления скоростью: label "Speed:" +
 * range-слайдер 1..10 + span с текущим значением (например "3x").
 */
function speedControl(state: SimState): HTMLElement {
  const label = document.createElement("label");
  label.textContent = "Speed: ";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "1";
  slider.max = "10";
  slider.value = String(state.speed);

  const display = document.createElement("span");
  display.textContent = `${state.speed}x`;
  display.style.minWidth = "24px";

  slider.oninput = () => {
    state.speed = parseInt(slider.value);
    display.textContent = `${state.speed}x`;
  };

  label.appendChild(slider);
  label.appendChild(display);
  return label;
}

/**
 * Создаёт элемент управления количеством клеток: label "Cells:" +
 * range-слайдер 0..maxCellCount (шаг 10) + span с числом.
 */
function countControl(
  state: SimState,
  onChange: (count: number) => void,
): HTMLElement {
  const label = document.createElement("label");
  label.textContent = "Cells: ";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = String(state.params.maxCellCount);
  slider.value = String(state.cells.count);
  slider.step = "10";

  const display = document.createElement("span");
  display.textContent = String(state.cells.count);
  display.style.minWidth = "36px";

  slider.oninput = () => {
    const count = parseInt(slider.value);
    display.textContent = String(count);
    onChange(count);
  };

  label.appendChild(slider);
  label.appendChild(display);
  return label;
}
