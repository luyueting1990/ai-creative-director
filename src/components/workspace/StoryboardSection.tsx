"use client";

import type { Dispatch } from "react";
import { totalDuration, type EditorAction } from "@/lib/editor";
import type { PhotoItem } from "@/lib/photos";
import type { Concept } from "@/lib/schema";
import { EditableText, Icons, cx } from "../ui";
import { ConceptSwitcher } from "./ConceptSwitcher";
import { DurationInput, FieldRow, NextStep, PhotoTile, RowControls, SectionHeading } from "./shared";

interface Props {
  concepts: Concept[];
  concept: Concept;
  onSelect: (id: string) => void;
  dispatch: Dispatch<EditorAction>;
  photos: PhotoItem[];
  targetSec: number;
  onNext: () => void;
}

function timecode(sec: number): string {
  const s = Math.floor(sec);
  return `00:${String(s).padStart(2, "0")}${sec % 1 ? ".5" : ""}`;
}

export function StoryboardSection({ concepts, concept, onSelect, dispatch, photos, targetSec, onNext }: Props) {
  const frames = concept.storyboard;
  const base = { conceptId: concept.id, list: "storyboard" as const };
  const total = totalDuration(frames);
  const swatches = concept.palette.length ? concept.palette : [{ name: "", hex: "#2a2a2a" }];
  const diff = Math.round((total - targetSec) * 10) / 10;

  // Assign uploaded photos to product frames in order, cycling if needed.
  const photoFor = frames.map((f, i) => {
    if (!f.featuresProduct || !photos.length) return null;
    const nth = frames.slice(0, i).filter((x) => x.featuresProduct).length;
    return photos[nth % photos.length];
  });
  const starts = frames.map((_, i) => frames.slice(0, i).reduce((sum, f) => sum + (Number(f.durationSec) || 0), 0));

  return (
    <div>
      <SectionHeading index="03" kicker="Video storyboard" title={concept.title}>
        <ConceptSwitcher concepts={concepts} selectedId={concept.id} onSelect={onSelect} />
      </SectionHeading>

      {/* Timeline */}
      <div className="mb-8">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 font-mono text-[11px] uppercase tracking-wider">
          <span className="text-bone">
            {frames.length} frames · <span className="tabular-nums">{total}s</span>
          </span>
          <span className={cx(diff === 0 ? "text-acid" : "text-signal")}>
            Target {targetSec}s {diff === 0 ? "· on time" : diff > 0 ? `· ${diff}s over` : `· ${Math.abs(diff)}s under`}
          </span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-char-2" aria-hidden>
          {frames.map((f, i) => (
            <span
              key={f.id}
              className="h-full border-r border-ink last:border-0"
              style={{ width: `${(f.durationSec / Math.max(total, targetSec)) * 100}%`, background: swatches[i % swatches.length].hex }}
            />
          ))}
        </div>
      </div>

      <ol className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {frames.map((f, i) => {
          const a = swatches[i % swatches.length].hex;
          const b = swatches[(i + 2) % swatches.length].hex;
          const photo = photoFor[i];
          return (
            <li key={f.id} className="flex animate-fade-up flex-col overflow-hidden rounded-2xl bg-paper text-ink" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="sprockets h-3 bg-ink" aria-hidden />
              <div className="relative aspect-video overflow-hidden bg-ink">
                {photo ? (
                  <PhotoTile photo={photo} className="h-full w-full" label={`Frame ${i + 1} product reference: ${photo.name}`} />
                ) : (
                  <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
                    <svg className="h-full w-full opacity-25 mix-blend-overlay" viewBox="0 0 160 90" preserveAspectRatio="none" aria-hidden>
                      <path d="M0 60 Q40 40 80 55 T160 50" stroke="white" fill="none" strokeWidth="0.6" />
                      <circle cx="120" cy="25" r="10" stroke="white" fill="none" strokeWidth="0.6" />
                      <path d="M53 90 L53 18 M107 90 L107 18 M0 30 L160 30 M0 60 L160 60" stroke="white" strokeWidth="0.25" />
                    </svg>
                  </div>
                )}
                <span className="absolute left-2.5 top-2.5 rounded bg-ink/80 px-1.5 py-0.5 font-mono text-[10px] text-bone backdrop-blur">
                  {String(i + 1).padStart(2, "0")} · {timecode(starts[i])}
                </span>
                {f.featuresProduct && (
                  <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded bg-signal px-1.5 py-0.5 font-mono text-[10px] uppercase text-ink">
                    <Icons.Star className="h-3 w-3" /> Product
                  </span>
                )}
                {f.onScreenText && (
                  <span className="absolute inset-x-3 bottom-3 text-center font-display text-lg uppercase leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                    {f.onScreenText}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <EditableText
                    label={`Frame ${i + 1} title`}
                    value={f.title}
                    onChange={(v) => dispatch({ ...base, type: "updateItem", itemId: f.id, patch: { title: v } })}
                    className="font-display text-2xl uppercase leading-none"
                  />
                  <DurationInput
                    label={`Frame ${i + 1} duration in seconds`}
                    value={f.durationSec}
                    onChange={(n) => dispatch({ ...base, type: "updateItem", itemId: f.id, patch: { durationSec: n } })}
                  />
                </div>
                <FieldRow label="Visual">
                  <EditableText
                    label={`Frame ${i + 1} visual`}
                    value={f.visual}
                    onChange={(v) => dispatch({ ...base, type: "updateItem", itemId: f.id, patch: { visual: v } })}
                    className="text-sm leading-relaxed"
                  />
                </FieldRow>
                <FieldRow label="Audio">
                  <EditableText
                    label={`Frame ${i + 1} audio`}
                    value={f.audio}
                    onChange={(v) => dispatch({ ...base, type: "updateItem", itemId: f.id, patch: { audio: v } })}
                    className="text-sm opacity-75"
                  />
                </FieldRow>
                <FieldRow label="On-screen text">
                  <EditableText
                    label={`Frame ${i + 1} on-screen text`}
                    value={f.onScreenText}
                    onChange={(v) => dispatch({ ...base, type: "updateItem", itemId: f.id, patch: { onScreenText: v } })}
                    className="font-serif text-base italic"
                  />
                </FieldRow>
                <div className="mt-auto flex items-center justify-between border-t border-ink/10 pt-2">
                  <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px] uppercase tracking-wider opacity-70">
                    <input
                      type="checkbox"
                      checked={f.featuresProduct}
                      onChange={(e) =>
                        dispatch({ ...base, type: "updateItem", itemId: f.id, patch: { featuresProduct: e.target.checked } })
                      }
                      className="h-3.5 w-3.5 accent-[#ff4d2e]"
                    />
                    Product shot
                  </label>
                  <RowControls
                    index={i}
                    length={frames.length}
                    noun="frame"
                    onMove={(d) => dispatch({ ...base, type: "moveItem", itemId: f.id, direction: d })}
                    onInsert={() => dispatch({ ...base, type: "addItem", afterId: f.id })}
                    onRemove={() => dispatch({ ...base, type: "removeItem", itemId: f.id })}
                  />
                </div>
              </div>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => dispatch({ ...base, type: "addItem" })}
            className="flex h-full min-h-48 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-bone/25 text-mute transition hover:border-bone/60 hover:text-bone"
          >
            <Icons.Plus className="h-6 w-6" />
            Add frame
          </button>
        </li>
      </ol>

      {photos.length === 0 && (
        <p className="mt-6 flex items-center gap-2 text-xs text-mute">
          <Icons.Info className="h-3.5 w-3.5" /> Add product photos in the brief to see them in product frames.
        </p>
      )}

      <NextStep label="Production plan" onClick={onNext} />
    </div>
  );
}
