interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: "default" | "green" | "gold" | "red";
}

const colorMap = {
  default: "var(--accent-bright)",
  green: "var(--green)",
  gold: "var(--gold)",
  red: "var(--red)",
};

export default function StatCard({ label, value, sub, color = "default" }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1 border transition-all hover:scale-[1.02]"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>
      <div className="text-2xl font-bold" style={{ color: colorMap[color] }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

