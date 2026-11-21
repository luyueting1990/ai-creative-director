"use client";

import { useState, type Dispatch, type ReactNode } from "react";
import type { EditorAction } from "@/lib/editor";
import { LINK_LABELS, classifyLink, displayLink } from "@/lib/links";
import type { PhotoItem } from "@/lib/photos";
import { PLATFORM_LABELS, type BriefRead, type Brief, type Concept, type GenerationSource } from "@/lib/schema";
import { EditableText, IconButton, Icons } from "../ui";

interface Props {
  concept: Concept;
  brief: Brief;
  read: BriefRead;
  source: GenerationSource;
  photos: PhotoItem[];
  dispatch: Dispatch<EditorAction>;
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-mute">{title}</h3>
      {children}
    </section>
  );
}

/** Secondary information, collapsed by default: social copy, production notes, look and brief notes. */
export function MoreDetails({ concept, brief, read, source, photos, dispatch }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const update = (list: "hooks" | "captions" | "shots", itemId: string, patch: Record<string, unknown>) =>
    dispatch({ type: "updateItem", conceptId: concept.id, list, itemId, patch });

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch {
      /* clipboard can be blocked; the text stays selectable */
    }
  }

  return (
    <details className="group rounded-xl border border-bone/10">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 hover:bg-bone/[0.03] sm:px-5">
        <span className="text-sm text-bone">
          More details <span className="text-mute">· captions, hooks, production notes, look</span>
        </span>
        <Icons.Chevron className="h-4 w-4 text-mute transition group-open:rotate-180" />
      </summary>

      <div className="grid gap-8 border-t border-bone/10 p-4 sm:p-5 lg:grid-cols-2">
        <Group title="Hooks & captions">
          <ul className="space-y-2">
            {concept.hooks.map((h) => (
              <li key={h.id} className="flex items-start gap-3 rounded-lg bg-char px-3 py-2">
                <span className="mt-1.5 w-16 shrink-0 font-mono text-[10px] uppercase text-mute">{PLATFORM_LABELS[h.platform]} hook</span>
                <EditableText label={`${PLATFORM_LABELS[h.platform]} hook`} value={h.text} onChange={(v) => update("hooks", h.id, { text: v })} className="text-sm" />
              </li>
            ))}
            {concept.captions.map((c) => {
              const full = `${c.text}${c.hashtags.length ? ` ${c.hashtags.join(" ")}` : ""}`;
              return (
                <li key={c.id} className="flex items-start gap-3 rounded-lg bg-char px-3 py-2">
                  <span className="mt-1.5 w-16 shrink-0 font-mono text-[10px] uppercase text-mute">{PLATFORM_LABELS[c.platform]}</span>
                  <div className="min-w-0 flex-1">
                    <EditableText label={`${PLATFORM_LABELS[c.platform]} caption`} value={c.text} onChange={(v) => update("captions", c.id, { text: v })} className="text-sm" />
                    <input
                      aria-label={`${PLATFORM_LABELS[c.platform]} hashtags`}
                      value={c.hashtags.join(" ")}
                      onChange={(e) =>
                        update("captions", c.id, { hashtags: e.target.value.split(/\s+/).filter((t, i, arr) => t || i === arr.length - 1) })
                      }
                      className="-mx-1.5 mt-0.5 w-full rounded bg-transparent px-1.5 py-0.5 font-mono text-[11px] text-signal focus:outline-none focus:ring-1 focus:ring-signal/60"
                    />
                  </div>
                  <IconButton label={`Copy ${PLATFORM_LABELS[c.platform]} caption`} onClick={() => copy(c.id, full)}>
                    {copied === c.id ? <Icons.Check className="h-3.5 w-3.5 text-signal" /> : <Icons.Copy className="h-3.5 w-3.5" />}
                  </IconButton>
                </li>
              );
            })}
          </ul>
        </Group>

        <Group title="Production notes">
          <ol className="divide-y divide-bone/10 rounded-lg bg-char">
            {concept.shots.map((s, i) => (
              <li key={s.id} className="grid grid-cols-[1.5rem_1fr] gap-x-2 px-3 py-2.5 text-sm">
                <span className="font-mono text-xs text-mute">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-bone">
                    {s.title} <span className="text-mute">· {s.durationSec}s</span>
                  </p>
                  <div className="mt-1 grid gap-x-3 text-xs text-bone/70 sm:grid-cols-2">
                    <EditableText label={`Shot ${i + 1} camera`} value={s.camera} onChange={(v) => update("shots", s.id, { camera: v })} placeholder="Camera" />
                    <EditableText label={`Shot ${i + 1} setting`} value={s.setting} onChange={(v) => update("shots", s.id, { setting: v })} placeholder="Setting" />
                  </div>
                  <EditableText
                    label={`Shot ${i + 1} direction`}
                    value={s.direction}
                    onChange={(v) => update("shots", s.id, { direction: v })}
                    placeholder="Direction for the crew"
                    className="text-xs italic text-bone/60"
                  />
                </div>
              </li>
            ))}
          </ol>
        </Group>

        <Group title="Look & sound">
          <dl className="space-y-2 text-sm">
            {(
              [
                ["setting", "Setting"],
                ["lighting", "Lighting"],
                ["styling", "Styling"],
              ] as const
            ).map(([k, l]) => (
              <div key={k} className="grid grid-cols-[5rem_1fr] items-start gap-2">
                <dt className="pt-1 text-xs text-mute">{l}</dt>
                <dd>
                  <EditableText
                    label={l}
                    value={concept.look[k]}
                    onChange={(v) => dispatch({ type: "updateConcept", conceptId: concept.id, patch: { look: { ...concept.look, [k]: v } } })}
                  />
                </dd>
              </div>
            ))}
            <div className="grid grid-cols-[5rem_1fr] items-start gap-2">
              <dt className="pt-1 text-xs text-mute">Music</dt>
              <dd>
                <EditableText label="Music" value={concept.music} onChange={(v) => dispatch({ type: "updateConcept", conceptId: concept.id, patch: { music: v } })} />
              </dd>
            </div>
            <div className="grid grid-cols-[5rem_1fr] items-center gap-2">
              <dt className="text-xs text-mute">Palette</dt>
              <dd className="flex gap-1.5">
                {concept.palette.map((s) => (
                  <span key={s.hex + s.name} title={`${s.name} ${s.hex}`} className="h-6 w-6 rounded-full ring-1 ring-bone/15" style={{ background: s.hex }} />
                ))}
              </dd>
            </div>
          </dl>
          <p className="text-sm text-bone/70">
            <span className="text-mute">Why this concept: </span>
            {concept.rationale}
          </p>
        </Group>

        <Group title="Your brief">
          <p className="text-sm text-bone/80">{read.summary}</p>
          {source === "demo" && (
            <ul className="space-y-1 text-xs text-mute">
              {read.notes.map((n) => (
                <li key={n}>— {n}</li>
              ))}
            </ul>
          )}
          {brief.links.length > 0 && (
            <ul className="space-y-1.5">
              {brief.links.map((u) => (
                <li key={u}>
                  <a href={u} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-bone/80 hover:text-bone">
                    <span className="w-16 shrink-0 font-mono text-[10px] uppercase text-mute">{LINK_LABELS[classifyLink(u)]}</span>
                    <span className="truncate underline-offset-4 hover:underline">{displayLink(u)}</span>
                    <Icons.External className="h-3 w-3 shrink-0 text-mute" />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {photos.length > 0 && <p className="text-xs text-mute">{photos.length} reference photo{photos.length > 1 ? "s" : ""} attached.</p>}
        </Group>
      </div>
    </details>
  );
}
