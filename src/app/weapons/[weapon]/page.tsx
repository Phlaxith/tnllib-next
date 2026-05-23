import WeaponPageClient from "@/components/WeaponPageClient";

const VALID_WEAPONS = ["bow","crossbow","dagger","gauntlet","orb","spear","staff","sword","sword2h","wand"];

const WEAPON_NAMES: Record<string, string> = {
  bow: "Bow", crossbow: "Crossbow", dagger: "Dagger", gauntlet: "Gauntlet",
  orb: "Orb", spear: "Spear", staff: "Staff", sword: "Sword & Shield",
  sword2h: "Greatsword", wand: "Wand",
};

export function generateStaticParams() {
  return VALID_WEAPONS.map((weapon) => ({ weapon }));
}

export async function generateMetadata({ params }: { params: Promise<{ weapon: string }> }) {
  const { weapon } = await params;
  const name = WEAPON_NAMES[weapon] ?? weapon;
  return { title: `TL Library — ${name}` };
}

export default async function WeaponPage({ params }: { params: Promise<{ weapon: string }> }) {
  const { weapon } = await params;
  return <WeaponPageClient weapon={weapon} />;
}

