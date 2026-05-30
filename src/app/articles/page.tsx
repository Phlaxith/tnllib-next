import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

const ARTICLES = [
  {
    title: "Loot Distribution Rules",
    description: "How contribution and loot allocation works across activities and boss modes.",
    href: "/articles/loot-distribution",
  },
];

export default function ArticlesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <BookOpen size={28} style={{ color: "var(--accent)" }} />
        Articles
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
        Notes and reference pages migrated from the original TL Library.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ARTICLES.map((article) => (
          <Link
            key={article.href}
            href={article.href}
            className="rounded-2xl border p-5 transition-all hover:scale-[1.01]"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{article.title}</h2>
              <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{article.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
