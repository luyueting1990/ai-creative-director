"use client";

import { LINK_LABELS, classifyLink, displayLink } from "@/lib/links";
import type { PhotoItem } from "@/lib/photos";
import {
  PLATFORM_LABELS,
  campaignDuration,
  campaignPlatforms,
  type BrandOverview,
  type Brief,
  type GenerationSource,
} from "@/lib/schema";
import { KIND_STYLE } from "../brief/LinkListInput";
import { Icons, cx } from "../ui";
import { NextStep, PhotoTile, SectionHeading } from "./shared";

interface Props {
  brief: Brief;
  overview: BrandOverview;
  photos: PhotoItem[];
  source: GenerationSource;
  onNext: () => void;
  onEditBrief: () => void;
}

export function OverviewSection({ brief, overview, photos, source, onNext, onEditBrief }: Props) {
  const links = [...brief.socialLinks, ...brief.websiteLinks, ...brief.videoLinks];

  return (
    <div>
      <SectionHeading index="01" kicker="Brand overview" title={brief.brandName} />

      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-10">
          <p className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.15] text-bone">{overview.summary}</p>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-bone/10 bg-bone/10 sm:grid-cols-2">
            <div className="bg-ink p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">Positioning</p>
              <p className="mt-3 leading-relaxed text-bone/85">{overview.positioning}</p>
            </div>
            <div className="bg-ink p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">Audience insight</p>
              <p className="mt-3 leading-relaxed text-bone/85">{overview.audienceInsight}</p>
            </div>
          </div>

          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Tone of voice</p>
            <div className="flex flex-wrap gap-2">
              {overview.toneKeywords.map((t, i) => (
                <span
                  key={t}
                  className={cx(
                    "rounded-full px-4 py-2 font-display text-xl uppercase",
                    i === 0 ? "bg-signal text-ink" : i === 1 ? "bg-bone text-ink" : "border border-bone/25 text-bone",
                  )}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Brand pillars</p>
            <ol className="grid gap-4 sm:grid-cols-3">
              {overview.pillars.map((p, i) => (
                <li key={p.title} className="border-t-2 border-bone pt-4">
                  <span className="font-mono text-[11px] text-signal">{String(i + 1).padStart(2, "0")}</span>
                  <p className="mt-1 font-display text-2xl uppercase leading-tight">{p.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-mute">{p.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="space-y-8">
          {source === "demo" && overview.signals.length > 0 && (
            <div className="rounded-2xl border border-acid/30 bg-acid/[0.06] p-5">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-acid">
                <Icons.Info className="h-3.5 w-3.5" /> How the demo read your brief
              </p>
              <ul className="mt-3 space-y-2 text-sm text-bone/80">
                {overview.signals.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="text-acid">—</span>
                    {s}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-mute">
                Rule-based keyword matching, not AI analysis. Concepts are illustrative examples.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-bone/10 p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Your brief</p>
              <button type="button" onClick={onEditBrief} className="text-xs text-bone/70 underline-offset-4 hover:text-bone hover:underline">
                Edit
              </button>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-mute">Product</dt>
                <dd className="text-bone/90">{brief.productDescription}</dd>
              </div>
              <div>
                <dt className="text-mute">Goal</dt>
                <dd className="text-bone/90">{brief.goal}</dd>
              </div>
              <div className="flex gap-6">
                <div>
                  <dt className="text-mute">Platforms</dt>
                  <dd className="text-bone/90">{campaignPlatforms(brief).map((p) => PLATFORM_LABELS[p]).join(", ")}</dd>
                </div>
                <div>
                  <dt className="text-mute">Film</dt>
                  <dd className="text-bone/90">{campaignDuration(brief)}s</dd>
                </div>
              </div>
            </dl>
          </div>

          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
              Product references · {photos.length}
            </p>
            {photos.length ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p) => (
                  <PhotoTile key={p.id} photo={p} className="aspect-[4/5] rounded-lg" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-mute">No photos attached. Add some in the brief to see them across the workspace.</p>
            )}
          </div>

          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Saved links · {links.length}</p>
            {links.length ? (
              <ul className="space-y-2">
                {links.map((u) => {
                  const kind = classifyLink(u);
                  return (
                    <li key={u}>
                      <a
                        href={u}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 rounded-lg border border-bone/10 p-2 text-sm transition hover:border-bone/40"
                      >
                        <span className={cx("rounded-full px-2 py-0.5 font-mono text-[9px] uppercase", KIND_STYLE[kind])}>
                          {LINK_LABELS[kind]}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-bone/80">{displayLink(u)}</span>
                        <Icons.External className="h-3.5 w-3.5 text-mute group-hover:text-bone" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-mute">No reference links added.</p>
            )}
          </div>
        </aside>
      </div>

      <NextStep label="Three concepts" onClick={onNext} />
    </div>
  );
}
