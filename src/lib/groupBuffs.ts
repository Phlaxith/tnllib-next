export type PlayerRole = {
  id: string;
  label: string;
  buffs: string[];
};

export type BuffRule = {
  id: string;
  label: string;
  min: number;
  max: number;
};

export const BUFF_RULES: BuffRule[] = [
  { id: "atk_up", label: "Attack Up", min: 1, max: 2 },
  { id: "skill_amp", label: "Skill Amplification", min: 1, max: 2 },
  { id: "crit_up", label: "Critical Chance Up", min: 1, max: 2 },
  { id: "heavy_up", label: "Heavy Attack Up", min: 1, max: 2 },
  { id: "def_break", label: "Defense Down (target)", min: 1, max: 2 },
  { id: "shield", label: "Party Shield", min: 1, max: 1 },
  { id: "heal_over_time", label: "Heal over Time", min: 1, max: 2 },
  { id: "mana_regen", label: "Mana Recovery", min: 1, max: 1 },
];

export const PLAYER_ROLES: PlayerRole[] = [
  { id: "wand_staff", label: "Wand / Staff", buffs: ["skill_amp", "heal_over_time", "mana_regen"] },
  { id: "wand_bow", label: "Wand / Bow", buffs: ["heal_over_time", "atk_up", "crit_up"] },
  { id: "sword_wand", label: "Sword / Wand", buffs: ["shield", "heal_over_time", "def_break"] },
  { id: "staff_bow", label: "Staff / Bow", buffs: ["skill_amp", "crit_up", "heavy_up"] },
  { id: "sword_staff", label: "Sword / Staff", buffs: ["shield", "atk_up", "skill_amp"] },
  { id: "dagger_crossbow", label: "Dagger / Crossbow", buffs: ["crit_up", "def_break", "heavy_up"] },
  { id: "spear_bow", label: "Spear / Bow", buffs: ["atk_up", "heavy_up", "def_break"] },
  { id: "greatsword_dagger", label: "Greatsword / Dagger", buffs: ["atk_up", "crit_up", "def_break"] },
];

export type PlayerPick = {
  uid: string;
  roleId: string;
};

export type PartyAssignment = {
  partyA: PlayerPick[];
  partyB: PlayerPick[];
};

function scoreParty(players: PlayerPick[], roleById: Record<string, PlayerRole>): number {
  const buffs = new Set<string>();
  for (const p of players) {
    const role = roleById[p.roleId];
    if (!role) continue;
    for (const b of role.buffs) buffs.add(b);
  }
  return buffs.size;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k <= 0) return [[]];
  if (k > arr.length) return [];
  if (k === arr.length) return [arr.slice()];

  const out: T[][] = [];
  for (let i = 0; i <= arr.length - k; i += 1) {
    const head = arr[i];
    for (const tail of combinations(arr.slice(i + 1), k - 1)) {
      out.push([head, ...tail]);
    }
  }
  return out;
}

export function assignBestTwoParties(players: PlayerPick[], partySize = 6): PartyAssignment {
  const roleById = Object.fromEntries(PLAYER_ROLES.map((r) => [r.id, r]));

  if (players.length <= partySize) {
    return { partyA: players, partyB: [] };
  }

  const targetA = Math.min(partySize, Math.ceil(players.length / 2));
  const combs = combinations(players, targetA);

  let best: PartyAssignment = { partyA: players.slice(0, targetA), partyB: players.slice(targetA) };
  let bestScore = -1;

  for (const partyA of combs) {
    const idSet = new Set(partyA.map((p) => p.uid));
    const partyB = players.filter((p) => !idSet.has(p.uid));

    if (partyB.length > partySize) continue;

    const aScore = scoreParty(partyA, roleById);
    const bScore = scoreParty(partyB, roleById);

    // Favor balanced groups first, then maximize total buff variety.
    const balancePenalty = Math.abs(partyA.length - partyB.length) * 0.1;
    const score = aScore + bScore - balancePenalty;

    if (score > bestScore) {
      bestScore = score;
      best = { partyA, partyB };
    }
  }

  return best;
}

export function countBuffs(players: PlayerPick[]): Record<string, number> {
  const roleById = Object.fromEntries(PLAYER_ROLES.map((r) => [r.id, r]));
  const out: Record<string, number> = {};

  for (const p of players) {
    const role = roleById[p.roleId];
    if (!role) continue;
    for (const buff of role.buffs) {
      out[buff] = (out[buff] ?? 0) + 1;
    }
  }

  return out;
}

