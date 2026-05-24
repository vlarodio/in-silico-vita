import type { SimParams } from "./types";

/** Значения по умолчанию для всех параметров симуляции */
export const DEFAULT_PARAMS: SimParams = {
  worldWidth: 800,
  worldHeight: 600,
  initialCellCount: 500,
  initialAggression: 0,

  // Энергия: 1 на метаболизм + 1 на шаг, питание до 5 за такт
  energyCost: 1,
  energyMoveCost: 1,
  envBaseEnergy: 5,
  initialEnergy: 100,

  // Пороги и эффективности: aggression 0..30 мирные (×1.0),
  // 31..70 защитники (×0.8), 71..100 агрессоры (×0.4)
  peacefulMax: 30,
  protectorMax: 70,
  peacefulEfficiency: 1.0,
  protectorEfficiency: 0.8,
  aggressorEfficiency: 0.4,

  // Ресурсная сетка: 64×48 ячеек, реген 1 за такт, макс 200 на ячейку
  resourceGridWidth: 64,
  resourceGridHeight: 48,
  resourceRegenRate: 1,
  resourceK: 200,

  baseSpeed: 1,
  maxCellCount: 3000,
};
