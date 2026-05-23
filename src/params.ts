import type { SimParams } from "./types";

/** Значения по умолчанию для всех параметров симуляции */
export const DEFAULT_PARAMS: SimParams = {
  worldWidth: 800,
  worldHeight: 600,
  initialCellCount: 500,
  initialAggression: 0,   // все клетки стартуют мирными
  baseSpeed: 1,            // клеток в такт
  maxCellCount: 3000,
};
