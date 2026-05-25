import type { SimParams } from "./types";

/** Параметры симуляции по умолчанию */
export const DEFAULT_PARAMS: SimParams = {
  // ─── Мир ───
  worldWidth: 800,
  worldHeight: 600,

  // ─── Начальная популяция ───
  initialPeacefulCount: 500,
  initialProtectorCount: 0,
  initialAggressorCount: 0,

  // ─── Энергия ───
  energyCost: 1,
  energyMoveCost: 1,
  envBaseEnergy: 8,
  initialEnergy: 512,

  // ─── Пороги и эффективности ───
  peacefulMax: 30,
  protectorMax: 70,
  peacefulEfficiency: 1.0,
  protectorEfficiency: 0.8,
  aggressorEfficiency: 0.4,

  // ─── Ресурсная сетка ───
  resourceGridWidth: 64,
  resourceGridHeight: 48,
  resourceRegenRate: 4,
  resourceK: 256,

  // ─── Движение ───
  baseSpeed: 1,
  chemotaxisRadius: 60,

  // ─── Размножение ───
  energyDiv: 410,
  minDivisionAge: 20,
  mutationSigma: 5,

  // ─── Взаимодействия ───
  taxRadius: 4,
  taxRate: 0.1,
  attackRadius: 4,

  // ─── Награды за убийство ───
  killAggressorReward: 50,
  killProtectorReward: 30,

  // ─── Инфекции ───
  infectionInterval: 0,
  infectionDelta: 50,
  infectionCount: 3,

  // ─── Хранилище ───
  maxCellCount: 3000,
};
