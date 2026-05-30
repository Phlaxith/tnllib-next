/**
 * Manual configuration of available 3D models.
 *
 * To add a model:
 *  1. Export your Blender object as GLB: File → Export → glTF 2.0 (.glb)
 *  2. Place the file in  public/models/weapons/<id>.glb  or  public/models/monsters/<id>.glb
 *  3. Add an entry to WEAPON_MODELS or MONSTER_MODELS below.
 */

// ── Weapons ───────────────────────────────────────────────────────────────

export type WeaponType =
  | "bow" | "crossbow" | "dagger" | "gauntlet" | "orb"
  | "spear" | "staff" | "sword" | "sword2h" | "wand";

export type ModelCategory = "item" | "skin";

export interface ModelEntry {
  /** Unique identifier — default file: public/models/weapons/{id}.glb */
  id: string;
  name: string;
  type: WeaponType;
  category: ModelCategory;
  description?: string;
  /** Custom path (overrides the default /models/weapons/{id}.glb) */
  modelPath?: string;
}

export const WEAPON_MODELS: ModelEntry[] = [
  // ── Add your weapons here ───────────────────────────────────────────────
  {
    id:       "cube",
    name:     "Cube (test GLB)",
    type:     "sword",
    category: "item",
    description: "Demo cube.glb file",
  },
];

// ── Monsters ──────────────────────────────────────────────────────────────

export type MonsterCategory = "common" | "elite" | "boss" | "world-boss";

export interface MonsterEntry {
  /** Unique identifier — default file: public/models/monsters/{id}.glb */
  id: string;
  name: string;
  category: MonsterCategory;
  description?: string;
  /** Animation name to play first (optional, plays the first available otherwise) */
  animationName?: string;
  /** Custom path (overrides the default /models/monsters/{id}.glb) */
  modelPath?: string;
}

export const MONSTER_MODELS: MonsterEntry[] = [
  // ── Working example: rigged Soldier (Three.js) ──────────────────────────
  {
    id:            "Soldier",
    name:          "Soldier",
    category:      "common",
    description:   "Rigged character — Three.js example (Walk, Run, TPose)",
    animationName: "Walk",
    modelPath:     "https://threejs.org/examples/models/gltf/Soldier.glb",
  },
  // ── Add your monsters here ──────────────────────────────────────────────
  {
    id:          "M_HarshCrow_Kimon",
    name:        "Fellinex",
    category:    "boss",
    description: "Pet Golem",
    modelPath:   "/models/monsters/M_HarshCrow_Kimon.glb",
  },
];
