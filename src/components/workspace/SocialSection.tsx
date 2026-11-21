"use client";

import { useState, type Dispatch } from "react";
import type { EditorAction } from "@/lib/editor";
import type { PhotoItem } from "@/lib/photos";
import { PLATFORM_LABELS, type Concept, type Platform } from "@/lib/schema";
import { EditableText, IconButton, Icons, cx } from "../ui";
import { ConceptSwitcher } from "./ConceptSwitcher";
import { NextStep, PhotoTile, SectionHeading } from "./shared";

interface Props {
  concepts: Concept[];
  concept: Concept;
  onSelect: (id: string) => void;
  dispatch: Dispatch<EditorAction>;
  platforms: Platform[];
  photos: PhotoItem[];
  brandName: string;
  onNext: () => void;
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch {
      /* clipboard can be blocked; the text stays selectable */
    }
  }
  return { copied, copy };
}

export function SocialSection({ concepts, concept, onSelect, dispatch, platforms, photos, brandName, onNext }: Props) {
  const { copied, copy } = useCopy();
  const hookBase = { conceptId: concept.id, list: "hooks" as const };
  const capBase = { conceptId: concept.id, list: "captions" as const };
  const missing = platforms.filter((p) => !concept.captions.some((c) => c.platform === p));
  const firstHook = concept.hooks.find((h) => h.platform === "tiktok")?.text ?? concept.tagline;

  return (
    <div>
      <SectionHeading index="05" kicker="Social" title="Hooks & captions">
        <ConceptSwitcher concepts={concepts} selectedId={concept.id} onSelect={onSelect} />
      </SectionHeading>

      <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-12">
          {(["tiktok", "instagram"] as const).map((p) => {
            const hooks = concept.hooks.filter((h) => h.platform === p);
            return (
              <section key={p} aria-label={`${PLATFORM_LABELS[p]} hooks`}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-3xl uppercase">
                    {PLATFORM_LABELS[p]} <span className="font-serif normal-case italic text-signal">hooks</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => dispatch({ ...hookBase, type: "addItem", platform: p })}
                    className="flex items-center gap-1.5 rounded-full border border-bone/15 px-3 py-1.5 text-xs text-bone/70 hover:border-bone/50 hover:text-bone"
                  >
                    <Icons.Plus className="h-3 w-3" /> Add hook
                  </button>
                </div>
                <p className="mb-4 text-sm text-mute">The first 1–2 seconds: on-screen text or the opening line of voice-over.</p>
                <ol className="space-y-2">
                  {hooks.map((h, i) => (
                    <li key={h.id} className="flex items-start gap-4 rounded-xl border border-bone/10 bg-char p-4">
                      <span className="font-display text-2xl leading-none text-signal">{i + 1}</span>
                      <EditableText
                        label={`${PLATFORM_LABELS[p]} hook ${i + 1}`}
                        value={h.text}
                        onChange={(v) => dispatch({ ...hookBase, type: "updateItem", itemId: h.id, patch: { text: v } })}
                        className="font-serif text-xl italic leading-snug"
                        placeholder="Write a hook…"
                      />
                      <div className="flex shrink-0">
                        <IconButton label={`Copy ${PLATFORM_LABELS[p]} hook ${i + 1}`} onClick={() => copy(h.id, h.text)}>
                          {copied === h.id ? <Icons.Check className="h-3.5 w-3.5 text-acid" /> : <Icons.Copy className="h-3.5 w-3.5" />}
                        </IconButton>
                        <IconButton
                          label={`Delete ${PLATFORM_LABELS[p]} hook ${i + 1}`}
                          onClick={() => dispatch({ ...hookBase, type: "removeItem", itemId: h.id })}
                        >
                          <Icons.Trash className="h-3.5 w-3.5" />
                        </IconButton>
                      </div>
                    </li>
                  ))}
                  {hooks.length === 0 && <li className="text-sm text-mute">No hooks yet.</li>}
                </ol>
              </section>
            );
          })}

          <section aria-label="Captions">
            <h3 className="mb-4 font-display text-3xl uppercase">
              Captions <span className="font-serif normal-case italic text-signal">per platform</span>
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {concept.captions.map((c, i) => {
                const full = `${c.text}${c.hashtags.length ? `\n\n${c.hashtags.join(" ")}` : ""}`;
                return (
                  <article key={c.id} className="flex flex-col rounded-2xl bg-paper p-5 text-ink">
                    <header className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-ink px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-bone">
                        {PLATFORM_LABELS[c.platform]}
                      </span>
                      <div className="flex items-center">
                        <span className="mr-1 font-mono text-[10px] tabular-nums opacity-50">{full.length} chars</span>
                        <IconButton label={`Copy ${PLATFORM_LABELS[c.platform]} caption`} onClick={() => copy(c.id, full)}>
                          {copied === c.id ? <Icons.Check className="h-3.5 w-3.5 text-emerald-600" /> : <Icons.Copy className="h-3.5 w-3.5" />}
                        </IconButton>
                        <IconButton
                          label={`Delete ${PLATFORM_LABELS[c.platform]} caption ${i + 1}`}
                          onClick={() => dispatch({ ...capBase, type: "removeItem", itemId: c.id })}
                        >
                          <Icons.Trash className="h-3.5 w-3.5" />
                        </IconButton>
                      </div>
                    </header>
                    <EditableText
                      label={`${PLATFORM_LABELS[c.platform]} caption text`}
                      value={c.text}
                      onChange={(v) => dispatch({ ...capBase, type: "updateItem", itemId: c.id, patch: { text: v } })}
                      className="text-[15px] leading-relaxed"
                      placeholder="Write a caption…"
                    />
                    <input
                      type="text"
                      aria-label={`${PLATFORM_LABELS[c.platform]} hashtags`}
                      value={c.hashtags.join(" ")}
                      onChange={(e) =>
                        dispatch({
                          ...capBase,
                          type: "updateItem",
                          itemId: c.id,
                          patch: { hashtags: e.target.value.split(/\s+/).filter((t, idx, arr) => t || idx === arr.length - 1) },
                        })
                      }
                      placeholder="#hashtags"
                      className="-mx-1.5 mt-3 rounded-md bg-transparent px-1.5 py-1 font-mono text-xs text-signal hover:bg-ink/5 focus:outline-none focus:ring-1 focus:ring-signal/60"
                    />
                  </article>
                );
              })}
            </div>
            {missing.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-mute">
                Add caption for:
                {missing.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => dispatch({ ...capBase, type: "addItem", platform: p })}
                    className="inline-flex items-center gap-1 rounded-full border border-bone/15 px-3 py-1 hover:border-bone/50 hover:text-bone"
                  >
                    <Icons.Plus className="h-3 w-3" /> {PLATFORM_LABELS[p]}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Phone preview */}
        <aside className="lg:sticky lg:top-36 lg:self-start">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Preview · first frame</p>
          <div className="mx-auto w-full max-w-[18rem] rounded-[2.2rem] border border-bone/15 bg-char-2 p-2.5 shadow-2xl">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[1.7rem]">
              {photos[0] ? (
                <PhotoTile photo={photos[0]} className="h-full w-full" />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    background: `linear-gradient(160deg, ${concept.palette[0]?.hex ?? "#333"}, ${concept.palette[2]?.hex ?? "#111"})`,
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
              <p
                className={cx(
                  "absolute inset-x-4 top-1/3 text-center font-display text-2xl uppercase leading-tight text-white",
                  "drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]",
                )}
              >
                {firstHook}
              </p>
              <div className="absolute inset-x-4 bottom-5 text-white">
                <p className="text-xs font-semibold">@{brandName.toLowerCase().replace(/[^a-z0-9]+/g, "") || "yourbrand"}</p>
                <p className="mt-1 line-clamp-2 text-[11px] opacity-90">{concept.captions[0]?.text ?? concept.tagline}</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-mute">Mock-up for review only.</p>
        </aside>
      </div>

      <NextStep label="Save & export" onClick={onNext} />
    </div>
  );
}
