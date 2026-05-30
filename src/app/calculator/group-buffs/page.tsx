"use client";

import { useMemo, useState } from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import {
  BUFF_RULES,
  PLAYER_ROLES,
  assignBestTwoParties,
  countBuffs,
  type PlayerPick,
} from "@/lib/groupBuffs";

type Status = "low" | "ok" | "high";

function getStatus(count: number, min: number, max: number): Status {
  if (count < min) return "low";
  if (count > max) return "high";
  return "ok";
}

function statusStyle(status: Status) {
  if (status === "low") {
    return { borderColor: "var(--green)", background: "color-mix(in srgb, var(--green) 12%, transparent)", color: "var(--green)" };
  }
  if (status === "high") {
    return { borderColor: "var(--red)", background: "color-mix(in srgb, var(--red) 12%, transparent)", color: "var(--red)" };
  }
  return { borderColor: "var(--yellow)", background: "color-mix(in srgb, var(--yellow) 12%, transparent)", color: "var(--yellow)" };
}

function PartyCard({ title, players }: { title: string; players: PlayerPick[] }) {
  const buffCounts = countBuffs(players);

  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
      <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{title}</h2>

      <div className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
        {players.length === 0 ? "No players in this party." : `${players.length} players`}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {players.map((p) => {
          const role = PLAYER_ROLES.find((r) => r.id === p.roleId);
          return (
            <span
              key={p.uid}
              className="text-xs px-2.5 py-1 rounded-full border"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-secondary)" }}
            >
              {role?.label ?? p.roleId}
            </span>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {BUFF_RULES.map((rule) => {
          const count = buffCounts[rule.id] ?? 0;
          const status = getStatus(count, rule.min, rule.max);
          return (
            <div
              key={rule.id}
              className="rounded-lg border px-3 py-2 text-sm flex items-center justify-between"
              style={statusStyle(status)}
            >
              <span>{rule.label}</span>
              <span className="font-semibold">{count} / {rule.min}-{rule.max}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function GroupBuffsPage() {
  const [players, setPlayers] = useState<PlayerPick[]>([]);

  const assignment = useMemo(() => assignBestTwoParties(players, 6), [players]);

  function addPlayer(roleId: string) {
    setPlayers((prev) => [
      ...prev,
      { uid: `${roleId}-${crypto.randomUUID()}`, roleId },
    ]);
  }

  function removePlayer(uid: string) {
    setPlayers((prev) => prev.filter((p) => p.uid !== uid));
  }

  function clearAll() {
    setPlayers([]);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <Users size={28} style={{ color: "var(--accent)" }} />
        PvE Group Buff Calculator
      </h1>

      <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
        Add players to the pool, then parties are auto-sorted to maximize buff coverage.
      </p>

      <section className="rounded-2xl border p-4 mb-6" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Add Players</h2>
          <button
            onClick={clearAll}
            className="text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--bg-secondary)" }}
          >
            <Trash2 size={14} />
            Clear roster
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {PLAYER_ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => addPlayer(role.id)}
              className="text-xs px-3 py-2 rounded-lg border flex items-center gap-1.5 transition-colors"
              style={{ borderColor: "var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            >
              <Plus size={13} />
              {role.label}
            </button>
          ))}
        </div>
      </section>

      {players.length > 0 && (
        <section className="rounded-2xl border p-4 mb-6" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Player Pool</h2>
          <div className="flex flex-wrap gap-2">
            {players.map((p, idx) => {
              const role = PLAYER_ROLES.find((r) => r.id === p.roleId);
              return (
                <button
                  key={p.uid}
                  onClick={() => removePlayer(p.uid)}
                  title="Remove player"
                  className="text-xs px-2.5 py-1.5 rounded-full border"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-secondary)" }}
                >
                  {idx + 1}. {role?.label ?? p.roleId}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PartyCard title="Party A" players={assignment.partyA} />
        <PartyCard title="Party B" players={assignment.partyB} />
      </div>

      <div className="mt-6 rounded-xl border p-4 text-xs leading-6" style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-card)" }}>
        <div className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Legend</div>
        <div>Green = min amount not reached</div>
        <div>Yellow = min amount reached</div>
        <div>Red = max amount exceeded</div>
      </div>
    </div>
  );
}

