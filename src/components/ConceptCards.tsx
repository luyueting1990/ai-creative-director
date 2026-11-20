"use client";

import type { Concept } from "@/lib/schema";
import { totalDuration } from "@/lib/editor";
import { cx } from "./ui";

interface Props {
  concepts: Concept[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function ConceptCards({ concepts, selectedId, onSelect }: Props) {
  return (
    <div role="tablist" aria-label="Campaign concepts" className="grid gap-4 md:grid-cols-3">
      {concepts.map((c, i) => {
        const active = c.id === selectedId;
        return (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(c.id)}
            style={{ animationDelay: `${i * 80}ms` }}
            className={cx(
              "group relative flex animate-fade-up flex-col overflow-hidden rounded-2xl bg-paper text-left transition-all duration-200",
              active
                ? "shadow-[0_24px_60px_-30px_rgba(21,20,18,0.55)] ring-2 ring-ink"
                : "ring-1 ring-line hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-30px_rgba(21,20,18,0.45)] hover:ring-ink/25",
            )}
          >
            <div className="flex h-20 w-full" aria-hidden>
              {c.palette.map((s) => (
                <span key={s.hex + s.name} className="flex-1" style={{ background: s.hex }} />
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
                Concept {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-2xl leading-tight tracking-tight">{c.title}</h3>
              <p className="font-display text-sm italic text-ink/70">“{c.tagline}”</p>
              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-ink/70">{c.bigIdea}</p>
              <div className="mt-auto flex gap-4 pt-3 text-[11px] uppercase tracking-wider text-muted">
                <span>{c.storyboard.length} frames</span>
                <span>{totalDuration(c.storyboard)}s</span>
                <span>{c.shotList.length} shots</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
