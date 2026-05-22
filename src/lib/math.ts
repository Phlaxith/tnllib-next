/**
 * Throne & Liberty — Damage & Healing Math Engine
 * (Migré depuis src/modules/math.js)
 */

export interface DamageParams {
  skillPer: number;
  skillFlat: number;
  minDmg: number;
  maxDmg: number;
  monsterDmg: number;
  dmgBuff1: number;
  dmgBuff2: number;
  sdb: number;
  ssdb: number;
  bonusDmg: number;
  defense: number;
  critHit: number;
  critDamage: number;
  heavyHit: number;
  heavyDmg: number;
  curse: number;
}

export const DEFAULT_PARAMS: DamageParams = {
  skillPer: 550, skillFlat: 35, minDmg: 100, maxDmg: 670,
  monsterDmg: 0, dmgBuff1: 0, dmgBuff2: 0,
  sdb: 300, ssdb: 120, bonusDmg: 20,
  defense: 0, critHit: 1600, critDamage: 34,
  heavyHit: 1400, heavyDmg: 100, curse: 113,
};

export const getChance = (rate: number) => (!rate || rate < 0) ? 0 : rate / (rate + 1000);
export const getHealChance = (rate: number) => (!rate || rate < 0) ? 0 : rate / (rate + 3000);
export const getDrMultiplier = (v: number) => 1 + getChance(v);
export const getDefenseMitigation = (def: number) => 1 / (1 + (def || 0) / 2700);
export const calcSkillBase = (per: number, flat: number, weapon: number) => (weapon * (per / 100)) + (flat || 0);

type Mode = "dmg" | "dot" | "heal" | "hot";

function calculate(base: number, p: DamageParams, isCrit: boolean, isHeavy: boolean, mode: Mode): number {
  let val = base;
  if (isCrit) val *= (1 + (p.critDamage / 100));
  const curseMult = 1 + (p.curse || 0) / 100;
  const sdbMult = getDrMultiplier(p.sdb) * getDrMultiplier(p.ssdb);
  if (mode === "heal" || mode === "hot") {
    val *= curseMult;
    val *= sdbMult;
  } else {
    val *= (1 + (p.monsterDmg || 0) / 100);
    val *= (1 + (p.dmgBuff1 || 0) / 100);
    val *= (1 + (p.dmgBuff2 || 0) / 100);
    val *= sdbMult;
    if (mode === "dot") val *= curseMult;
    val *= getDefenseMitigation(p.defense);
  }
  if (isHeavy) val *= 2;
  return val;
}

export const calcMinDmg = (p: DamageParams) => calculate(calcSkillBase(p.skillPer, p.skillFlat, p.minDmg), p, false, false, "dmg") + (p.bonusDmg || 0);
export const calcMaxCrit = (p: DamageParams) => calculate(calcSkillBase(p.skillPer, p.skillFlat, p.maxDmg), p, true, false, "dmg") + (p.bonusDmg || 0);
export function calcAvgSkillDmg(p: DamageParams) {
  const avgWep = (p.minDmg + p.maxDmg) / 2;
  const norm = calculate(calcSkillBase(p.skillPer, p.skillFlat, avgWep), p, false, false, "dmg");
  const crit = calculate(calcSkillBase(p.skillPer, p.skillFlat, p.maxDmg), p, true, false, "dmg");
  const cChance = getChance(p.critHit);
  const hChance = getChance(p.heavyHit);
  const avgNonHeavy = (norm * (1 - cChance)) + (crit * cChance);
  return avgNonHeavy + (avgNonHeavy * hChance) + (p.bonusDmg || 0);
}

export const calcMinDot = (p: DamageParams) => calculate(calcSkillBase(p.skillPer, p.skillFlat, (p.minDmg + p.maxDmg) / 2), p, false, false, "dot");
export const calcMaxCritDot = (p: DamageParams) => calculate(calcSkillBase(p.skillPer, p.skillFlat, (p.minDmg + p.maxDmg) / 2), p, true, false, "dot");
export function calcAvgDotDmg(p: DamageParams) {
  const avgWep = (p.minDmg + p.maxDmg) / 2;
  const norm = calculate(calcSkillBase(p.skillPer, p.skillFlat, avgWep), p, false, false, "dot");
  const crit = calculate(calcSkillBase(p.skillPer, p.skillFlat, avgWep), p, true, false, "dot");
  const cChance = getChance(p.critHit);
  const hChance = getChance(p.heavyHit);
  const avgNonHeavy = (norm * (1 - cChance)) + (crit * cChance);
  return avgNonHeavy + (avgNonHeavy * hChance);
}

export const calcMinHeal = (p: DamageParams) => calculate(calcSkillBase(p.skillPer, p.skillFlat, p.minDmg), p, false, false, "heal");
export const calcMaxCritHeal = (p: DamageParams) => calculate(calcSkillBase(p.skillPer, p.skillFlat, p.maxDmg), p, true, false, "heal");
export function calcAvgHeal(p: DamageParams) {
  const avgWep = (p.minDmg + p.maxDmg) / 2;
  const norm = calculate(calcSkillBase(p.skillPer, p.skillFlat, avgWep), p, false, false, "heal");
  const crit = calculate(calcSkillBase(p.skillPer, p.skillFlat, p.maxDmg), p, true, false, "heal");
  const cChance = getHealChance(p.critHit);
  const hChance = getHealChance(p.heavyHit);
  const avgNonHeavy = (norm * (1 - cChance)) + (crit * cChance);
  return avgNonHeavy + (avgNonHeavy * hChance);
}

export const calcMinHot = (p: DamageParams) => calculate(calcSkillBase(p.skillPer, p.skillFlat, (p.minDmg + p.maxDmg) / 2), p, false, false, "hot");
export const calcMaxCritHot = (p: DamageParams) => calculate(calcSkillBase(p.skillPer, p.skillFlat, (p.minDmg + p.maxDmg) / 2), p, true, false, "hot");
export function calcAvgHot(p: DamageParams) {
  const avgWep = (p.minDmg + p.maxDmg) / 2;
  const norm = calculate(calcSkillBase(p.skillPer, p.skillFlat, avgWep), p, false, false, "hot");
  const crit = calculate(calcSkillBase(p.skillPer, p.skillFlat, avgWep), p, true, false, "hot");
  const cChance = getHealChance(p.critHit);
  const hChance = getHealChance(p.heavyHit);
  const avgNonHeavy = (norm * (1 - cChance)) + (crit * cChance);
  return avgNonHeavy + (avgNonHeavy * hChance);
}

