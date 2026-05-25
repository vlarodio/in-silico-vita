import type { ResourceGrid, SimState } from "./types";

/** Радиус кружка клетки в пикселях */
const CELL_RADIUS = 2;

/** Цвет фона canvas (между ячейками сетки) */
const BG_COLOR = "#111";

/**
 * Отрисовывает один кадр:
 *   1. Ресурсный фон (зеленовато-серая сетка)
 *   2. Клетки поверх: кружки, цвет HSL(120 * (1 − aggression/100))
 */
export function render(
  ctx: CanvasRenderingContext2D,
  state: SimState,
  resourceImg: ImageData,
): void {
  const { worldWidth, worldHeight } = state.params;

  // Ресурсный фон
  updateResourceImage(state.resources, state.params, resourceImg);
  ctx.putImageData(resourceImg, 0, 0);

  // Клетки
  const { cells } = state;
  const { peacefulMax, protectorMax } = state.params;
  for (let i = 0; i < cells.count; i++) {
    if (!cells.alive[i]) continue;
    const agg = cells.aggression[i];
    if (agg <= peacefulMax) {
      ctx.fillStyle = "hsl(120, 70%, 50%)";       // зелёный — мирная
    } else if (agg <= protectorMax) {
      ctx.fillStyle = "hsl(240, 70%, 50%)";       // синий   — защитник
    } else {
      ctx.fillStyle = "hsl(0, 70%, 50%)";         // красный — агрессор
    }
    ctx.beginPath();
    ctx.arc(cells.x[i], cells.y[i], CELL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Создаёт ImageData нужного размера для ресурсного фона.
 * Вызывается один раз при инициализации рендера.
 */
export function createResourceImage(
  resourceGrid: ResourceGrid,
  worldWidth: number,
  worldHeight: number,
): ImageData {
  const offscreen = new OffscreenCanvas(worldWidth, worldHeight);
  const octx = offscreen.getContext("2d")!;
  return octx.createImageData(worldWidth, worldHeight);
}

/**
 * Заполняет ImageData значениями из ресурсной сетки.
 * Каждая ячейка сетки растягивается на блок пикселей:
 *   cellW = worldWidth  / gridWidth
 *   cellH = worldHeight / gridHeight
 */
export function updateResourceImage(
  grid: ResourceGrid,
  params: { resourceK: number; worldWidth: number; worldHeight: number },
  img: ImageData,
): void {
  const { resourceK, worldWidth, worldHeight } = params;
  const cellW = worldWidth / grid.width;
  const cellH = worldHeight / grid.height;

  for (let gy = 0; gy < grid.height; gy++) {
    for (let gx = 0; gx < grid.width; gx++) {
      const val = grid.data[gy * grid.width + gx] / resourceK;
      // зеленовато-серый: R и B чуть ниже G
      const r = Math.floor(val * 30);
      const g = Math.floor(val * 50);
      const b = Math.floor(val * 25);

      const px0 = Math.floor(gy * cellH);
      const px1 = Math.floor((gy + 1) * cellH);
      const py0 = Math.floor(gx * cellW);
      const py1 = Math.floor((gx + 1) * cellW);

      for (let row = px0; row < px1; row++) {
        for (let col = py0; col < py1; col++) {
          const idx = (row * worldWidth + col) * 4;
          img.data[idx] = r;
          img.data[idx + 1] = g;
          img.data[idx + 2] = b;
          img.data[idx + 3] = 255;
        }
      }
    }
  }
}
