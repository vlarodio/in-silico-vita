import type { SimParams } from "./types";

/** Значения по умолчанию для всех параметров симуляции */
export const DEFAULT_PARAMS: SimParams = {
  worldWidth: 800,
  worldHeight: 600,
  initialCellCount: 500,
  initialAggression: 0,

  // Энергия
  energyCost: 1,
  energyMoveCost: 1,
  envBaseEnergy: 8,
  initialEnergy: 512,

  // Пороги и эффективности: aggression 0..30 мирные (×1.0),
  // 31..70 защитники (×0.8), 71..100 агрессоры (×0.4)
  peacefulMax: 30,
  protectorMax: 70,
  peacefulEfficiency: 1.0,
  protectorEfficiency: 0.8,
  aggressorEfficiency: 0.4,

  // Ресурсная сетка: 64×48 ячеек, реген 4 за такт, макс 256 на ячейку
  resourceGridWidth: 64,
  resourceGridHeight: 48,
  resourceRegenRate: 4,
  resourceK: 256,

  // Движение
  baseSpeed: 1,

  // Размножение: деление при энергии ≥ 300, возраст ≥ 20, мутация σ = 5
  energyDiv: 300,
  minDivisionAge: 20,
  mutationSigma: 5,

  // Взаимодействия: только при касании — радиус 4 (клетка r=2 + зазор 2)
  taxRadius: 4,
  taxRate: 0.1,
  attackRadius: 4,

  // Награды за убийство
  killAggressorReward: 50,
  killProtectorReward: 30,

  // Инфекции: каждые 500 тактов 3 клетки +50 aggression, 0 - отключено
  infectionInterval: 0,
  infectionDelta: 50,
  infectionCount: 3,

  maxCellCount: 3000,
};
