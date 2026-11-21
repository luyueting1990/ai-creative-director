"use client";

import type { Dispatch } from "react";
import { totalDuration, type EditorAction } from "@/lib/editor";
import type { Concept, Shot } from "@/lib/schema";
import { EditableText, Icons } from "../ui";
import { ConceptSwitcher } from "./ConceptSwitcher";
import { DurationInput, FieldRow, NextStep, RowControls, SectionHeading } from "./shared";

interface Props {
  concepts: Concept[];
  concept: Concept;
  onSelect: (id: string) => void;
  dispatch: Dispatch<EditorAction>;
  onNext: () => void;
}

const FIELDS: { key: keyof Pick<Shot, "camera" | "movement" | "lighting" | "location" | "talent">; label: string }[] = [
  { key: "camera", label: "Camera / lens" },
  { key: "movement", label: "Movement" },
  { key: "lighting", label: "Lighting" },
  { key: "location", label: "Location" },
  { key: "talent", label: "Talent" },
];

export function ProductionSection({ concepts, concept, onSelect, dispatch, onNext }: Props) {
  const shots = concept.shotList;
  const base = { conceptId: concept.id, list: "shotList" as const };
  const locations = Array.from(new Set(shots.map((s) => s.location).filter((l) => l && l !== "Post-production")));

  return (
    <div>
      <SectionHeading index="04" kicker="Shot-by-shot production" title="Production plan">
        <ConceptSwitcher concepts={concepts} selectedId={concept.id} onSelect={onSelect} />
      </SectionHeading>

      <dl className="mb-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-bone/10 bg-bone/10 sm:grid-cols-4">
        {[
          ["Shots", shots.length],
          ["Runtime", `${totalDuration(shots)}s`],
          ["Locations", locations.length],
          ["Concept", concept.title],
        ].map(([k, v]) => (
          <div key={k} className="bg-ink p-5">
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">{k}</dt>
            <dd className="mt-1 truncate font-display text-3xl uppercase">{v}</dd>
          </div>
        ))}
      </dl>

      <ol className="space-y-4">
        {shots.map((s, i) => (
          <li
            key={s.id}
            className="grid animate-fade-up gap-4 rounded-2xl border border-bone/10 bg-char p-5 md:grid-cols-[5rem_1fr] md:p-6"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-start justify-between md:flex-col md:justify-start md:gap-3">
              <span className="font-display text-6xl leading-none text-signal">{String(i + 1).padStart(2, "0")}</span>
              <DurationInput
                label={`Shot ${i + 1} duration in seconds`}
                value={s.durationSec}
                onChange={(n) => dispatch({ ...base, type: "updateItem", itemId: s.id, patch: { durationSec: n } })}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <EditableText
                    label={`Shot ${i + 1} type`}
                    value={s.shotType}
                    onChange={(v) => dispatch({ ...base, type: "updateItem", itemId: s.id, patch: { shotType: v } })}
                    className="font-mono text-xs uppercase tracking-[0.15em] text-acid"
                  />
                  <EditableText
                    label={`Shot ${i + 1} action`}
                    value={s.description}
                    onChange={(v) => dispatch({ ...base, type: "updateItem", itemId: s.id, patch: { description: v } })}
                    className="mt-1 text-lg leading-snug text-bone"
                  />
                </div>
                <RowControls
                  index={i}
                  length={shots.length}
                  noun="shot"
                  onMove={(d) => dispatch({ ...base, type: "moveItem", itemId: s.id, direction: d })}
                  onRemove={() => dispatch({ ...base, type: "removeItem", itemId: s.id })}
                />
              </div>
              <div className="mt-4 grid gap-x-6 gap-y-3 text-sm text-bone/80 sm:grid-cols-2 lg:grid-cols-5">
                {FIELDS.map((f) => (
                  <FieldRow key={f.key} label={f.label}>
                    <EditableText
                      label={`Shot ${i + 1} ${f.label}`}
                      value={s[f.key]}
                      onChange={(v) => dispatch({ ...base, type: "updateItem", itemId: s.id, patch: { [f.key]: v } })}
                    />
                  </FieldRow>
                ))}
              </div>
              <div className="mt-4 rounded-lg border-l-2 border-signal bg-signal/[0.06] py-2 pl-3 pr-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-signal">Director&apos;s note</p>
                <EditableText
                  label={`Shot ${i + 1} director's note`}
                  value={s.direction}
                  onChange={(v) => dispatch({ ...base, type: "updateItem", itemId: s.id, patch: { direction: v } })}
                  className="font-serif text-lg italic text-bone/90"
                  placeholder="Add a note for the crew…"
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => dispatch({ ...base, type: "addItem" })}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-bone/25 py-5 text-mute transition hover:border-bone/60 hover:text-bone"
      >
        <Icons.Plus /> Add shot
      </button>

      <NextStep label="Hooks & captions" onClick={onNext} />
    </div>
  );
}
