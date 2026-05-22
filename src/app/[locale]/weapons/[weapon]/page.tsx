import WeaponPageClient from "@/components/WeaponPageClient";
import { getTranslations } from "next-intl/server";

const VALID_WEAPONS = ["bow","crossbow","dagger","gauntlet","orb","spear","staff","sword","sword2h","wand"];

export function generateStaticParams() {
  return VALID_WEAPONS.map((weapon) => ({ weapon }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; weapon: string }>;
}) {
  const { locale, weapon } = await params;
  const t = await getTranslations({ locale, namespace: "weapons" });
  const name = t(`names.${weapon}` as Parameters<typeof t>[0], { defaultValue: weapon });
  return { title: `TL Library — ${name}` };
}

export default async function WeaponPage({
  params,
}: {
  params: Promise<{ locale: string; weapon: string }>;
}) {
  const { weapon } = await params;
  return <WeaponPageClient weapon={weapon} />;
}

