"use client";

import type { Concept } from "@/lib/schema";
import { cx } from "../ui";

export function ConceptSwitcher({
  concepts,
  selectedId,
  onSelect,
}: {
  concepts: Concept[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div role="group" aria-label="Switch concept" className="flex flex-wrap gap-1.5">
      {concepts.map((c, i) => (
        <button
          key={c.id}
          type="button"
          aria-pressed={c.id === selectedId}
          onClick={() => onSelect(c.id)}
          className={cx(
            "rounded-full px-3 py-1.5 text-xs transition",
            c.id === selectedId ? "bg-bone text-ink" : "border border-bone/15 text-bone/60 hover:border-bone/50 hover:text-bone",
          )}
        >
          <span className="mr-1.5 font-mono text-[10px] opacity-60">{String(i + 1).padStart(2, "0")}</span>
          {c.title}
        </button>
      ))}
    </div>
  );
}
