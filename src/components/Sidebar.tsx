"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Swords, Fish, Trophy, Calculator, BookOpen,
  ChevronDown, ChevronRight, Skull, Package, ScrollText,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";

type NavItem = {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
};

// Static navigation config — component references, no JSX, no runtime dependency
type NavConfig = {
  label: string;
  hrefSuffix?: string;
  Icon?: LucideIcon;
  children?: NavConfig[];
};

const NAV_CONFIG: NavConfig[] = [
  { label: "Home",        hrefSuffix: "/",                    Icon: Home },
  { label: "3D Bestiary", hrefSuffix: "/bestiary",             Icon: Skull },
  {
    label: "3D Item Viewer",
    Icon: Package,
    children: [
      { label: "Weapons", hrefSuffix: "/items/weapons" },
    ],
  },
  {
    label: "Articles",
    Icon: ScrollText,
    children: [
      { label: "Loot Distribution", hrefSuffix: "/articles/loot-distribution" },
    ],
  },
  {
    label: "Tables",
    Icon: BookOpen,
    children: [
      { label: "Achievements", hrefSuffix: "/achievements", Icon: Trophy },
      { label: "Fishing",      hrefSuffix: "/fishing",      Icon: Fish },
    ],
  },
  {
    label: "Weapons skills",
    Icon: Swords,
    children: [
      { label: "Weapon Mastery",  hrefSuffix: "/weapons/mastery" },
      { label: "Bow",             hrefSuffix: "/weapons/bow" },
      { label: "Crossbow",        hrefSuffix: "/weapons/crossbow" },
      { label: "Dagger",          hrefSuffix: "/weapons/dagger" },
      { label: "Orb",             hrefSuffix: "/weapons/orb" },
      { label: "Spear",           hrefSuffix: "/weapons/spear" },
      { label: "Staff",           hrefSuffix: "/weapons/staff" },
      { label: "Sword & Shield",  hrefSuffix: "/weapons/sword" },
      { label: "Greatsword",      hrefSuffix: "/weapons/sword2h" },
      { label: "Wand",            hrefSuffix: "/weapons/wand" },
      { label: "Gauntlet",        hrefSuffix: "/weapons/gauntlet" },
    ],
  },
  {
    label: "Calculators",
    Icon: Calculator,
    children: [
      { label: "Damage / Healing", hrefSuffix: "/calculator/damage" },
      { label: "Group Buffs",      hrefSuffix: "/calculator/group-buffs" },
      { label: "Stats",            hrefSuffix: "/calculator/stats" },
    ],
  },
];

function buildNavItems(config: NavConfig[]): NavItem[] {
  return config.map((item) => ({
    label:    item.label,
    href:     item.hrefSuffix,
    icon:     item.Icon ? <item.Icon size={16} /> : undefined,
    children: item.children ? buildNavItems(item.children) : undefined,
  }));
}

const NAV = buildNavItems(NAV_CONFIG);

export default function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 flex flex-col border-r z-40"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Image
            src="https://assets.playnccdn.com/common/tl.ico"
            alt="TL"
            width={28}
            height={28}
            className="rounded"
            unoptimized
          />
          <div>
            <div className="font-bold text-base" style={{ color: "var(--text-primary)" }}>TL Library</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Throne &amp; Liberty</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink key={item.href ?? item.label} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
        <ThemeToggle />
        <LanguageSelector />
        <div className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          <a href="https://ko-fi.com/phlaxith" target="_blank" rel="noreferrer">☕ Ko-fi</a>
          {" · "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">cc-by-sa-4.0</a>
        </div>
      </div>
    </aside>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const isActive = item.href
    ? pathname === item.href || (item.href.endsWith("/") && pathname === item.href.slice(0, -1))
    : false;

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <span style={{ color: "var(--accent)" }}>{item.icon}</span>
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {open && (
          <div className="ml-6 mt-1 flex flex-col gap-0.5 border-l pl-3" style={{ borderColor: "var(--border)" }}>
            {item.children.map((child) => (
              <NavLink key={child.href ?? child.label} item={child} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all")}
      style={{
        color: isActive ? "var(--accent-bright)" : "var(--text-secondary)",
        background: isActive ? "var(--accent-glow)" : "transparent"
      }}
    >
      {item.icon && <span style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}>{item.icon}</span>}
      {item.label}
    </Link>
  );
}
