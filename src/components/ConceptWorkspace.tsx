"use client";

import { useState, type Dispatch } from "react";
import { totalDuration, type EditorAction } from "@/lib/editor";
import { PLATFORM_LABELS, type Concept, type Platform } from "@/lib/schema";
import { EditableText, IconButton, Icons, cx } from "./ui";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "storyboard", label: "Storyboard" },
  { id: "shots", label: "Shot list" },
  { id: "captions", label: "Captions" },
] as const;
type TabId = (typeof TABS)[number]["id"];

interface Props {
  concept: Concept;
  index: number;
  platforms: Platform[];
  dispatch: Dispatch<EditorAction>;
}

export function ConceptWorkspace({ concept, index, platforms, dispatch }: Props) {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <section
      aria-label={`Concept ${index + 1}: ${concept.title}`}
      className="overflow-hidden rounded-3xl bg-paper ring-1 ring-line shadow-[0_30px_80px_-50px_rgba(21,20,18,0.5)]"
    >
      <div className="flex flex-col gap-4 border-b border-line px-5 pt-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
              Concept {String(index + 1).padStart(2, "0")} · editing
            </span>
            <EditableText
              label="Concept title"
              value={concept.title}
              onChange={(v) => dispatch({ type: "updateConcept", conceptId: concept.id, patch: { title: v } })}
              className="font-display text-3xl tracking-tight sm:text-4xl"
            />
          </div>
        </div>
        <div role="tablist" aria-label="Concept sections" className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cx(
                "whitespace-nowrap border-b-2 px-3 pb-3 pt-1 text-sm transition",
                tab === t.id ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink",
              )}
            >
              {t.label}
              {t.id === "storyboard" && <Count n={concept.storyboard.length} />}
              {t.id === "shots" && <Count n={concept.shotList.length} />}
              {t.id === "captions" && <Count n={concept.captions.length} />}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="p-5 sm:p-8">
        {tab === "overview" && <Overview concept={concept} dispatch={dispatch} />}
        {tab === "storyboard" && <Storyboard concept={concept} dispatch={dispatch} />}
        {tab === "shots" && <ShotList concept={concept} dispatch={dispatch} />}
        {tab === "captions" && <Captions concept={concept} platforms={platforms} dispatch={dispatch} />}
      </div>
    </section>
  );
}

function Count({ n }: { n: number }) {
  return <span className="ml-1.5 rounded-full bg-ink/5 px-1.5 text-[11px] tabular-nums text-muted">{n}</span>;
}

/* ------------------------------------------------------------------------ */

function Overview({ concept, dispatch }: { concept: Concept; dispatch: Dispatch<EditorAction> }) {
  const patch = (p: Partial<Concept>) => dispatch({ type: "updateConcept", conceptId: concept.id, patch: p });
  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <Block label="Tagline">
          <EditableText
            label="Tagline"
            value={concept.tagline}
            onChange={(v) => patch({ tagline: v })}
            className="font-display text-xl italic"
          />
        </Block>
        <Block label="Big idea">
          <EditableText
            label="Big idea"
            value={concept.bigIdea}
            onChange={(v) => patch({ bigIdea: v })}
            className="text-[15px] leading-relaxed text-ink/85"
          />
        </Block>
        <Block label="Visual direction">
          <EditableText
            label="Visual direction"
            value={concept.visualDirection}
            onChange={(v) => patch({ visualDirection: v })}
            className="text-[15px] leading-relaxed text-ink/85"
          />
        </Block>
      </div>
      <div className="space-y-6">
        <Block label="Palette">
          <div className="grid grid-cols-5 gap-2">
            {concept.palette.map((s, i) => (
              <div key={i} className="space-y-1.5">
                <label className="relative block aspect-[3/4] cursor-pointer overflow-hidden rounded-lg ring-1 ring-black/5">
                  <span className="absolute inset-0" style={{ background: s.hex }} />
                  <input
                    type="color"
                    aria-label={`Colour ${s.name}`}
                    value={s.hex}
                    onChange={(e) =>
                      patch({
                        palette: concept.palette.map((p, j) => (j === i ? { ...p, hex: e.target.value.toUpperCase() } : p)),
                      })
                    }
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </label>
                <p className="truncate text-[11px] font-medium">{s.name}</p>
                <p className="font-mono text-[10px] uppercase text-muted">{s.hex}</p>
              </div>
            ))}
          </div>
        </Block>
        <Block label="Soundtrack">
          <EditableText
            label="Soundtrack"
            value={concept.soundtrack}
            onChange={(v) => patch({ soundtrack: v })}
            className="text-sm leading-relaxed text-ink/80"
          />
        </Block>
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-ivory p-4 text-center">
          <Stat label="Runtime" value={`${totalDuration(concept.storyboard)}s`} />
          <Stat label="Frames" value={concept.storyboard.length} />
          <Stat label="Shots" value={concept.shotList.length} />
        </div>
      </div>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">{label}</h4>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-display text-2xl tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function RowControls({
  index,
  length,
  noun,
  onMove,
  onRemove,
  onInsert,
}: {
  index: number;
  length: number;
  noun: string;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
  onInsert?: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <IconButton label={`Move ${noun} ${index + 1} up`} disabled={index === 0} onClick={() => onMove(-1)}>
        <Icons.Up className="h-3.5 w-3.5" />
      </IconButton>
      <IconButton label={`Move ${noun} ${index + 1} down`} disabled={index === length - 1} onClick={() => onMove(1)}>
        <Icons.Down className="h-3.5 w-3.5" />
      </IconButton>
      {onInsert && (
        <IconButton label={`Insert ${noun} after ${index + 1}`} onClick={onInsert}>
          <Icons.Plus className="h-3.5 w-3.5" />
        </IconButton>
      )}
      <IconButton label={`Delete ${noun} ${index + 1}`} onClick={onRemove} className="hover:text-red-600">
        <Icons.Trash className="h-3.5 w-3.5" />
      </IconButton>
    </div>
  );
}

function DurationInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <label className="inline-flex shrink-0 items-center rounded-full bg-ink/5 px-2 py-0.5 text-[11px] tabular-nums text-ink/70">
      <input
        type="number"
        min={0}
        max={120}
        step={0.5}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(Math.min(120, Math.max(0, Number(e.target.value) || 0)))}
        className="w-7 appearance-none bg-transparent text-right focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
      />
      s
    </label>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-24 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/20 text-sm text-muted transition hover:border-ink/40 hover:bg-white/60 hover:text-ink"
    >
      <Icons.Plus /> {children}
    </button>
  );
}

function Storyboard({ concept, dispatch }: { concept: Concept; dispatch: Dispatch<EditorAction> }) {
  const frames = concept.storyboard;
  const base = { conceptId: concept.id, list: "storyboard" as const };
  const swatches = concept.palette.length ? concept.palette : [{ name: "", hex: "#d6d0c4" }];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between text-sm text-muted">
        <span>
          {frames.length} frames · <span className="tabular-nums">{totalDuration(frames)}s</span> total
        </span>
        <span className="hidden sm:inline">Click any text to edit</span>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {frames.map((f, i) => {
          const a = swatches[i % swatches.length].hex;
          const b = swatches[(i + 2) % swatches.length].hex;
          return (
            <li key={f.id} className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-line">
              <div
                className="relative flex aspect-video items-end p-3"
                style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
              >
                <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {f.onScreenText && (
                  <span className="mx-auto max-w-[90%] text-center font-display text-sm text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
                    {f.onScreenText}
                  </span>
                )}
                <Icons.Film className="absolute right-3 top-3 h-4 w-4 text-white/70" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <EditableText
                    label={`Frame ${i + 1} title`}
                    value={f.title}
                    onChange={(v) => dispatch({ ...base, type: "updateItem", itemId: f.id, patch: { title: v } })}
                    className="font-display text-lg leading-snug"
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
                    className="text-sm leading-relaxed text-ink/85"
                  />
                </FieldRow>
                <FieldRow label="Audio">
                  <EditableText
                    label={`Frame ${i + 1} audio`}
                    value={f.audio}
                    onChange={(v) => dispatch({ ...base, type: "updateItem", itemId: f.id, patch: { audio: v } })}
                    className="text-sm text-ink/70"
                  />
                </FieldRow>
                <FieldRow label="On screen">
                  <EditableText
                    label={`Frame ${i + 1} on-screen text`}
                    value={f.onScreenText}
                    onChange={(v) => dispatch({ ...base, type: "updateItem", itemId: f.id, patch: { onScreenText: v } })}
                    className="text-sm italic text-ink/70"
                  />
                </FieldRow>
                <div className="mt-auto flex justify-end border-t border-line pt-2">
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
          <AddButton onClick={() => dispatch({ ...base, type: "addItem" })}>Add frame</AddButton>
        </li>
      </ol>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">{label}</p>
      {children}
    </div>
  );
}

const SHOT_COLUMNS = [
  { key: "shotType", label: "Shot", width: "w-32" },
  { key: "description", label: "Description", width: "min-w-56" },
  { key: "camera", label: "Camera / lens", width: "min-w-44" },
  { key: "location", label: "Location", width: "min-w-40" },
  { key: "talent", label: "Talent", width: "min-w-32" },
] as const;

function ShotList({ concept, dispatch }: { concept: Concept; dispatch: Dispatch<EditorAction> }) {
  const shots = concept.shotList;
  const base = { conceptId: concept.id, list: "shotList" as const };
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl ring-1 ring-line">
        <table className="w-full min-w-[860px] border-collapse bg-white text-sm">
          <thead>
            <tr className="border-b border-line bg-ivory/60 text-left text-[10px] uppercase tracking-[0.18em] text-muted">
              <th scope="col" className="w-10 px-3 py-3 font-medium">#</th>
              {SHOT_COLUMNS.map((c) => (
                <th key={c.key} scope="col" className={cx("px-3 py-3 font-medium", c.width)}>
                  {c.label}
                </th>
              ))}
              <th scope="col" className="w-20 px-3 py-3 font-medium">Sec</th>
              <th scope="col" className="w-28 px-3 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {shots.map((s, i) => (
              <tr key={s.id} className="border-b border-line/70 align-top last:border-0 hover:bg-ivory/40">
                <td className="px-3 py-3 font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</td>
                {SHOT_COLUMNS.map((c) => (
                  <td key={c.key} className="px-3 py-2">
                    <EditableText
                      label={`Shot ${i + 1} ${c.label}`}
                      value={s[c.key]}
                      onChange={(v) => dispatch({ ...base, type: "updateItem", itemId: s.id, patch: { [c.key]: v } })}
                      className={cx("text-sm", c.key === "shotType" && "font-medium")}
                    />
                  </td>
                ))}
                <td className="px-3 py-3">
                  <DurationInput
                    label={`Shot ${i + 1} duration in seconds`}
                    value={s.durationSec}
                    onChange={(n) => dispatch({ ...base, type: "updateItem", itemId: s.id, patch: { durationSec: n } })}
                  />
                </td>
                <td className="px-2 py-2">
                  <RowControls
                    index={i}
                    length={shots.length}
                    noun="shot"
                    onMove={(d) => dispatch({ ...base, type: "moveItem", itemId: s.id, direction: d })}
                    onRemove={() => dispatch({ ...base, type: "removeItem", itemId: s.id })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => dispatch({ ...base, type: "addItem" })}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted ring-1 ring-dashed ring-ink/20 transition hover:bg-white hover:text-ink"
      >
        <Icons.Plus /> Add shot
      </button>
    </div>
  );
}

function Captions({
  concept,
  platforms,
  dispatch,
}: {
  concept: Concept;
  platforms: Platform[];
  dispatch: Dispatch<EditorAction>;
}) {
  const base = { conceptId: concept.id, list: "captions" as const };
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch {
      /* clipboard may be blocked; the text remains selectable */
    }
  }

  const missing = platforms.filter((p) => !concept.captions.some((c) => c.platform === p));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {concept.captions.map((c, i) => {
          const full = `${c.text}${c.hashtags.length ? `\n\n${c.hashtags.join(" ")}` : ""}`;
          return (
            <article key={c.id} className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-line">
              <header className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-ivory">
                  {PLATFORM_LABELS[c.platform]}
                </span>
                <div className="flex items-center gap-1">
                  <span className="mr-1 text-[11px] tabular-nums text-muted">{full.length} chars</span>
                  <IconButton label={`Copy ${PLATFORM_LABELS[c.platform]} caption`} onClick={() => copy(c.id, full)}>
                    {copied === c.id ? <Icons.Check className="h-3.5 w-3.5 text-emerald-600" /> : <Icons.Copy className="h-3.5 w-3.5" />}
                  </IconButton>
                  <IconButton
                    label={`Delete ${PLATFORM_LABELS[c.platform]} caption ${i + 1}`}
                    onClick={() => dispatch({ ...base, type: "removeItem", itemId: c.id })}
                    className="hover:text-red-600"
                  >
                    <Icons.Trash className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              </header>
              <EditableText
                label={`${PLATFORM_LABELS[c.platform]} caption text`}
                value={c.text}
                onChange={(v) => dispatch({ ...base, type: "updateItem", itemId: c.id, patch: { text: v } })}
                className="text-[15px] leading-relaxed"
                placeholder="Write a caption…"
              />
              <input
                type="text"
                aria-label={`${PLATFORM_LABELS[c.platform]} hashtags`}
                value={c.hashtags.join(" ")}
                onChange={(e) =>
                  dispatch({
                    ...base,
                    type: "updateItem",
                    itemId: c.id,
                    patch: { hashtags: e.target.value.split(/\s+/).filter((t, idx, arr) => t || idx === arr.length - 1) },
                  })
                }
                placeholder="#hashtags"
                className="mt-3 w-full rounded-md bg-transparent px-1.5 py-1 -mx-1.5 text-sm text-accent hover:bg-ink/[0.035] focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent/60"
              />
            </article>
          );
        })}
      </div>
      {missing.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          Add caption for:
          {missing.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => dispatch({ ...base, type: "addItem", platform: p })}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 ring-1 ring-line transition hover:bg-white hover:text-ink"
            >
              <Icons.Plus className="h-3 w-3" /> {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
