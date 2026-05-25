import type { SimState } from "./types";

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

const BUTTON_STYLE = `
  padding: 4px 12px;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
`;

const INPUT_STYLE = `
  width: 60px;
  padding: 2px 4px;
  font-family: inherit;
  font-size: inherit;
  background: #333;
  color: #ccc;
  border: 1px solid #555;
  border-radius: 2px;
`;

/** Объект управления UI: метод updateLiveCounts дёргается движком каждый кадр */
export interface Controls {
  updateLiveCounts(peaceful: number, protector: number, aggressor: number): void;
}

/**
 * Строит DOM-панель управления: Start/Stop, Pause/Resume, Speed,
 * три поля ввода количества клеток по типам, Apply.
 * Возвращает Controls для live-обновления значений из движка.
 */
export function createControls(
  container: HTMLElement,
  state: SimState,
  onStart: (peaceful: number, protector: number, aggressor: number) => void,
  onStop: () => void,
): Controls {
  const panel = document.createElement("div");
  panel.setAttribute("style", PANEL_STYLE);

  // Start / Stop
  const startStopBtn = document.createElement("button");
  startStopBtn.textContent = "Start";
  startStopBtn.setAttribute("style", BUTTON_STYLE);
  panel.appendChild(startStopBtn);

  // Pause / Resume
  const pauseBtn = document.createElement("button");
  pauseBtn.textContent = "Pause";
  pauseBtn.setAttribute("style", BUTTON_STYLE);
  pauseBtn.disabled = true;
  panel.appendChild(pauseBtn);

  const speedGroup = speedControl(state);
  panel.appendChild(speedGroup);

  panel.appendChild(document.createTextNode(" "));

  const peacefulInput = initInput(state.params.initialPeacefulCount);
  const protectorInput = initInput(state.params.initialProtectorCount);
  const aggressorInput = initInput(state.params.initialAggressorCount);

  panel.appendChild(labeledInput(peacefulInput, "Зелёные", "#4c4"));
  panel.appendChild(labeledInput(protectorInput, "Синие", "#44c"));
  panel.appendChild(labeledInput(aggressorInput, "Красные", "#c44"));

  // Apply
  const applyBtn = document.createElement("button");
  applyBtn.textContent = "Apply";
  applyBtn.setAttribute("style", BUTTON_STYLE);
  panel.appendChild(applyBtn);

  container.appendChild(panel);

  // --- handlers ---

  startStopBtn.onclick = () => {
    if (state.running) {
      onStop();
    } else {
      onStart(
        parseInt(peacefulInput.value) || 0,
        parseInt(protectorInput.value) || 0,
        parseInt(aggressorInput.value) || 0,
      );
    }
  };

  pauseBtn.onclick = () => {
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? "Resume" : "Pause";
  };

  applyBtn.onclick = () => {
    onStart(
      parseInt(peacefulInput.value) || 0,
      parseInt(protectorInput.value) || 0,
      parseInt(aggressorInput.value) || 0,
    );
    // Apply подготавливает клетки но не запускает
    state.running = false;
    state.paused = false;
  };

  let wasActive = false;

  return {
    updateLiveCounts(peaceful: number, protector: number, aggressor: number) {
      const active = state.running;
      startStopBtn.textContent = active ? "Stop" : "Start";
      peacefulInput.disabled = active;
      protectorInput.disabled = active;
      aggressorInput.disabled = active;
      pauseBtn.disabled = !active;
      applyBtn.disabled = active;

      if (active) {
        peacefulInput.value = String(peaceful);
        protectorInput.value = String(protector);
        aggressorInput.value = String(aggressor);
      } else if (wasActive) {
        // только что остановились — показать дефолты один раз
        peacefulInput.value = String(state.params.initialPeacefulCount);
        protectorInput.value = String(state.params.initialProtectorCount);
        aggressorInput.value = String(state.params.initialAggressorCount);
        pauseBtn.textContent = "Pause";
        state.paused = false;
      }
      wasActive = active;
    },
  };
}

/** Создаёт слайдер скорости: label + range + span с текущим значением */
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

/** Создаёт <input type="number"> с заданным значением и стилем */
function initInput(value: number): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.max = "3000";
  input.value = String(value);
  input.setAttribute("style", INPUT_STYLE);
  return input;
}

/** Оборачивает input в label с цветной точкой и подписью */
function labeledInput(input: HTMLInputElement, title: string, color: string): HTMLElement {
  const wrap = document.createElement("label");
  wrap.style.display = "inline-flex";
  wrap.style.alignItems = "center";
  wrap.style.gap = "3px";

  const dot = document.createElement("span");
  dot.style.display = "inline-block";
  dot.style.width = "8px";
  dot.style.height = "8px";
  dot.style.borderRadius = "50%";
  dot.style.backgroundColor = color;
  dot.title = title;
  wrap.appendChild(dot);
  wrap.appendChild(input);
  return wrap;
}
