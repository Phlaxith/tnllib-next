import { ScrollText } from "lucide-react";

type RuleSection = {
  title: string;
  bullets: string[];
};

const RULES: RuleSection[] = [
  {
    title: "General Activities",
    bullets: [
      "Open World Farming, Abyss Dungeon Farming, Quests, Contracts, Dynamic Events, Co-op Dungeons (excluding final reward chest).",
      "Applicable enemies: Normal, Elite, Party Elite.",
      "When an enemy dies, loot is first assigned to the player who first contributed damage; if in a party, loot is assigned to the party pool.",
      "Drops are distributed with equal chance across eligible party members; out-of-range members with no contribution are excluded.",
      "Items are distributed as evenly as possible; remaining items are randomly assigned.",
      "Sollant and experience are distributed evenly.",
    ],
  },
  {
    title: "Peace Mode Bosses and Guild Raids",
    bullets: [
      "Applicable enemies: Field Bosses and Arch Bosses.",
      "Players are sorted by individual contribution; guild total contribution does not affect peace mode boss rewards.",
      "Players must meet a minimum contribution threshold to be eligible.",
      "Contribution drops use weighted chance based on individual contribution.",
      "Random drops are assigned only among eligible players who did not receive contribution drops.",
      "One player can receive at most one epic equipment drop per boss kill.",
      "Sollant and experience are distributed evenly.",
    ],
  },
  {
    title: "Conflict Mode Bosses",
    bullets: [
      "Applicable enemies: Field Bosses and Arch Bosses.",
      "Loot assignment is a two-stage process: first to guilds, then to players inside the winning guild(s).",
      "Guild contribution is the sum of participating members' individual contributions.",
      "Guilds are ranked by contribution and must meet a minimum threshold for eligibility.",
      "Loot chance is weighted by guild contribution.",
      "In conflict mode, player death reduces that player's individual contribution by 70%, reducing final guild contribution.",
      "After a guild wins an item, all participating players in that guild roll equally for that item.",
      "Sollant and experience are distributed evenly.",
    ],
  },
];

export default function LootDistributionPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <ScrollText size={28} style={{ color: "var(--gold)" }} />
        Loot Distribution Rules
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
        Migrated article from the original TL Library (11/5/24 reference text).
      </p>

      <section className="rounded-2xl border p-5 mb-5" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Definitions</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <li><strong>Contribution:</strong> earned by damaging enemies and healing allied players during active encounters.</li>
          <li><strong>Event Items:</strong> temporary items dropped in Dynamic Events and turned in for event progress.</li>
        </ul>
      </section>

      {RULES.map((section) => (
        <section key={section.title} className="rounded-2xl border p-5 mb-5" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{section.title}</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            {section.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </section>
      ))}

      <section className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Examples</h2>
        <div className="text-sm space-y-4" style={{ color: "var(--text-secondary)" }}>
          <p>
            <strong>Peace mode:</strong> if your individual contribution is 3%, you have a 3% chance to receive each
            contribution-weighted epic item. Players who receive one epic item are excluded from receiving another
            epic from the same kill.
          </p>
          <p>
            <strong>Conflict mode:</strong> if players A, B and C in one guild contribute 10%, 15% and 20%, that guild
            reaches 45% total contribution and has a 45% chance for each weighted item.
          </p>
        </div>
      </section>
    </div>
  );
}

