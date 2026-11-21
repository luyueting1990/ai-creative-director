"use client";

import type { Dispatch, ReactNode } from "react";
import { totalDuration, type EditorAction } from "@/lib/editor";
import type { PhotoItem } from "@/lib/photos";
import type { Concept } from "@/lib/schema";
import { EditableText, Icons, cx } from "../ui";
import { NextStep, PhotoTile, SectionHeading, Swatches, readableOn } from "./shared";

interface Props {
  concepts: Concept[];
  selectedId: string;
  onSelect: (id: string) => void;
  dispatch: Dispatch<EditorAction>;
  photos: PhotoItem[];
  onNext: () => void;
}

export function ConceptsSection({ concepts, selectedId, onSelect, dispatch, photos, onNext }: Props) {
  const index = Math.max(0, concepts.findIndex((c) => c.id === selectedId));
  const concept = concepts[index];

  return (
    <div>
      <SectionHeading index="02" kicker="Creative directions" title={<>Three concepts</>}>
        <p className="max-w-sm text-sm text-mute">
          Pick the direction to develop. The storyboard, production plan and social copy follow your selection.
        </p>
      </SectionHeading>

      <div role="tablist" aria-label="Campaign concepts" className="grid gap-4 lg:grid-cols-3">
        {concepts.map((c, i) => {
          const active = c.id === concept.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(c.id)}
              style={{ animationDelay: `${i * 90}ms` }}
              className={cx(
                "group relative flex min-h-[22rem] animate-fade-up flex-col overflow-hidden rounded-2xl text-left transition-all duration-300",
                active
                  ? "bg-bone text-ink shadow-[0_30px_80px_-30px_rgba(255,77,46,0.5)]"
                  : "border border-bone/10 bg-char hover:-translate-y-1 hover:border-bone/30",
              )}
            >
              <Swatches palette={c.palette} className="h-3" />
              <div className="relative flex flex-1 flex-col p-6">
                <span
                  aria-hidden
                  className={cx(
                    "pointer-events-none absolute -right-2 -top-4 font-display text-[9rem] leading-none",
                    active ? "text-ink/[0.07]" : "text-bone/[0.05]",
                  )}
                >
                  {i + 1}
                </span>
                <span className={cx("font-mono text-[10px] uppercase tracking-[0.22em]", active ? "text-signal" : "text-mute")}>
                  Concept {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-4xl uppercase leading-[0.9]">{c.title}</h3>
                <p className={cx("mt-3 font-serif text-xl italic leading-snug", active ? "text-ink/80" : "text-bone/80")}>
                  {c.tagline}
                </p>
                <p className={cx("mt-4 line-clamp-4 text-sm leading-relaxed", active ? "text-ink/70" : "text-mute")}>{c.bigIdea}</p>
                <div
                  className={cx(
                    "mt-auto flex items-center justify-between pt-6 font-mono text-[10px] uppercase tracking-wider",
                    active ? "text-ink/60" : "text-mute",
                  )}
                >
                  <span>
                    {c.storyboard.length} frames · {totalDuration(c.storyboard)}s · {c.shotList.length} shots
                  </span>
                  <span className={cx("rounded-full px-2 py-1", active ? "bg-ink text-bone" : "border border-bone/20")}>
                    {active ? "Selected" : "Select"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <ConceptDetail key={concept.id} concept={concept} index={index} dispatch={dispatch} photos={photos} />

      <NextStep label="Edit the storyboard" onClick={onNext} />
    </div>
  );
}

function ConceptDetail({
  concept,
  index,
  dispatch,
  photos,
}: {
  concept: Concept;
  index: number;
  dispatch: Dispatch<EditorAction>;
  photos: PhotoItem[];
}) {
  function patch(p: Partial<Omit<Concept, "id" | "storyboard" | "shotList" | "hooks" | "captions">>) {
    dispatch({ type: "updateConcept", conceptId: concept.id, patch: p });
  }
  const m = concept.moodboard;

  return (
    <section aria-label={`Concept ${index + 1} detail`} className="mt-12 animate-fade-up">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal">Concept {String(index + 1).padStart(2, "0")} · editing</p>
            <EditableText
              label="Concept title"
              value={concept.title}
              onChange={(v) => patch({ title: v })}
              className="mt-2 font-display text-5xl uppercase leading-[0.9] sm:text-6xl"
            />
            <EditableText
              label="Tagline"
              value={concept.tagline}
              onChange={(v) => patch({ tagline: v })}
              className="mt-3 font-serif text-2xl italic text-bone/85"
            />
          </div>
          <Block label="Big idea">
            <EditableText label="Big idea" value={concept.bigIdea} onChange={(v) => patch({ bigIdea: v })} className="text-[17px] leading-relaxed text-bone/90" />
          </Block>
          <Block label="Why it works">
            <EditableText label="Why it works" value={concept.whyItWorks} onChange={(v) => patch({ whyItWorks: v })} className="leading-relaxed text-bone/80" />
          </Block>
          <Block label="Visual direction">
            <EditableText
              label="Visual direction"
              value={concept.visualDirection}
              onChange={(v) => patch({ visualDirection: v })}
              className="leading-relaxed text-bone/80"
            />
          </Block>
          <Block label="Soundtrack">
            <EditableText label="Soundtrack" value={concept.soundtrack} onChange={(v) => patch({ soundtrack: v })} className="leading-relaxed text-bone/80" />
          </Block>
        </div>

        {/* Moodboard collage */}
        <div>
          <p className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-mute">
            Moodboard guidance
            <span className="text-bone/40">Click a swatch to recolour</span>
          </p>
          <div className="grid auto-rows-[5.5rem] grid-cols-4 gap-2">
            {photos.slice(0, 2).map((p, i) => (
              <PhotoTile key={p.id} photo={p} className={cx("rounded-lg", i === 0 ? "col-span-2 row-span-3" : "col-span-2 row-span-2")} />
            ))}
            {concept.palette.map((s, i) => (
              <label
                key={i}
                className={cx(
                  "relative flex cursor-pointer flex-col justify-end rounded-lg p-2 ring-1 ring-black/10",
                  photos.length === 0 && i === 0 && "col-span-2 row-span-2",
                )}
                style={{ background: s.hex, color: readableOn(s.hex) }}
              >
                <span className="font-mono text-[9px] uppercase">{s.name}</span>
                <span className="font-mono text-[9px] uppercase opacity-70">{s.hex}</span>
                <input
                  type="color"
                  aria-label={`Colour ${s.name}`}
                  value={s.hex}
                  onChange={(e) =>
                    patch({ palette: concept.palette.map((p, j) => (j === i ? { ...p, hex: e.target.value.toUpperCase() } : p)) })
                  }
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
            ))}
            {m.keywords.slice(0, 6).map((k, i) => (
              <div
                key={k}
                className={cx(
                  "flex items-center justify-center rounded-lg p-2 text-center",
                  i % 3 === 0 ? "bg-signal text-ink" : i % 3 === 1 ? "border border-bone/20" : "bg-char-2",
                  i === 0 && "col-span-2",
                )}
              >
                <span className={cx(i === 0 ? "font-display text-2xl uppercase" : "font-serif text-lg italic")}>{k}</span>
              </div>
            ))}
          </div>

          <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-bone/10 bg-bone/10 text-sm">
            {(
              [
                ["Lighting", m.lighting],
                ["Styling", m.styling],
                ["Locations", m.locations],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="bg-ink p-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">{k}</dt>
                <dd className="mt-1.5 leading-relaxed text-bone/85">{v}</dd>
              </div>
            ))}
            <div className="bg-ink p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">Reference directions</dt>
              <dd className="mt-1.5">
                <ul className="space-y-1 text-bone/85">
                  {m.references.map((r) => (
                    <li key={r} className="flex gap-2">
                      <Icons.Right className="mt-1 h-3 w-3 shrink-0 text-mute" />
                      {r}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-bone/10 pt-4">
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-mute">{label}</p>
      {children}
    </div>
  );
}
