/**
 * Configuration manuelle des modèles 3D disponibles.
 *
 * Pour ajouter un modèle :
 *  1. Exportez votre objet Blender en GLB : Fichier → Exporter → glTF 2.0 (.glb)
 *  2. Déposez le fichier dans  public/models/weapons/<id>.glb  ou  public/models/monsters/<id>.glb
 *  3. Ajoutez une entrée dans WEAPON_MODELS ou MONSTER_MODELS ci-dessous.
 */

// ── Weapons ───────────────────────────────────────────────────────────────

export type WeaponType =
  | "bow" | "crossbow" | "dagger" | "gauntlet" | "orb"
  | "spear" | "staff" | "sword" | "sword2h" | "wand";

export type ModelCategory = "item" | "skin";

export interface ModelEntry {
  /** Identifiant unique — fichier par défaut : public/models/weapons/{id}.glb */
  id: string;
  name: string;
  type: WeaponType;
  category: ModelCategory;
  description?: string;
  /** Chemin personnalisé (écrase le chemin par défaut /models/weapons/{id}.glb) */
  modelPath?: string;
}

export const WEAPON_MODELS: ModelEntry[] = [
  // ── Ajoutez vos armes ici ───────────────────────────────────────────────
  {
    id:       "cube",
    name:     "Cube (test GLB)",
    type:     "sword",
    category: "item",
    description: "Fichier cube.glb de démonstration",
  },
];

// ── Monsters ──────────────────────────────────────────────────────────────

export type MonsterCategory = "common" | "elite" | "boss" | "world-boss";

export interface MonsterEntry {
  /** Identifiant unique — fichier par défaut : public/models/monsters/{id}.glb */
  id: string;
  name: string;
  category: MonsterCategory;
  description?: string;
  /** Nom de l'animation à jouer en priorité (optionnel, joue la 1ère dispo sinon) */
  animationName?: string;
  /** Chemin personnalisé (écrase le chemin par défaut /models/monsters/{id}.glb) */
  modelPath?: string;
}

export const MONSTER_MODELS: MonsterEntry[] = [
  // ── Exemple fonctionnel : Soldier riggé (Three.js) ──────────────────────
  {
    id:            "Soldier",
    name:          "Soldier",
    category:      "common",
    description:   "Personnage riggé — exemple Three.js (Walk, Run, TPose)",
    animationName: "Walk",
    modelPath:     "https://threejs.org/examples/models/gltf/Soldier.glb",
  },
  // ── Ajoutez vos monstres ici ────────────────────────────────────────────
  {
    id:          "ALO",
    name:        "ALO (test GLB)",
    category:    "common",
    description: "Fichier de test local",
  },
];
