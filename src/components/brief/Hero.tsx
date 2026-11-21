"use client";

import { Icons } from "../ui";

const TICKER = [
  "Brand overview",
  "Three concepts",
  "Moodboards",
  "Storyboards",
  "Shot lists",
  "TikTok hooks",
  "Instagram captions",
  "Export",
];

const STEPS = [
  { n: "01", title: "Brief", body: "Describe the brand and product, then add photos and references." },
  { n: "02", title: "Direct", body: "Get three distinct creative directions, each with a moodboard and palette." },
  { n: "03", title: "Produce", body: "Edit the storyboard, shot list, hooks and captions, then save and export." },
];

export function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative overflow-hidden border-b border-bone/10">
      {/* Decorative colour fields */}
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-signal/25 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-lilac/15 blur-[120px]" />

      <div className="relative mx-auto max-w-[1440px] px-4 pb-14 pt-12 sm:px-8 sm:pt-20">
        <div className="flex flex-wrap items-center gap-3 animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-acid/40 bg-acid/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-acid">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-acid" aria-hidden />
            Interactive demo · no API key
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Fashion campaign studio — Vol. 01</span>
        </div>

        <h1 className="mt-8 font-display uppercase leading-[0.82] tracking-[-0.01em] animate-fade-up [animation-delay:80ms]">
          <span className="block text-[clamp(3.6rem,13vw,13rem)]">From brief</span>
          <span className="flex flex-wrap items-baseline gap-x-[0.2em] text-[clamp(3.6rem,13vw,13rem)]">
            <span className="font-serif text-[0.85em] normal-case italic tracking-tight text-signal">to</span>
            <span className="text-outline">campaign</span>
          </span>
        </h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <p className="max-w-xl text-lg leading-relaxed text-bone/75 animate-fade-up [animation-delay:160ms] sm:text-xl">
            Your AI creative director turns a fashion brief into a brand overview, three distinct campaign concepts,
            moodboards, an editable storyboard, a shot-by-shot production plan, and social hooks and captions.
          </p>
          <div className="flex flex-wrap items-center gap-4 animate-fade-up [animation-delay:240ms] lg:justify-end">
            <button
              type="button"
              onClick={onStart}
              className="group inline-flex h-16 items-center gap-4 rounded-full bg-signal pl-8 pr-3 text-lg font-medium text-ink transition hover:bg-[#ff6a4f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
            >
              Start a campaign
              <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-bone transition-transform group-hover:translate-x-1">
                <Icons.Right />
              </span>
            </button>
          </div>
        </div>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-bone/10 bg-bone/10 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="bg-ink p-6">
              <span className="font-mono text-[11px] text-signal">{s.n}</span>
              <p className="mt-2 font-display text-3xl uppercase">{s.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-mute">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="relative flex overflow-hidden border-t border-bone/10 bg-bone py-3 text-ink" aria-hidden>
        <div className="flex shrink-0 animate-marquee gap-10 whitespace-nowrap pr-10">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-10 font-display text-2xl uppercase">
              {t}
              <span className="text-signal">✺</span>
            </span>
          ))}
        </div>
        <div className="flex shrink-0 animate-marquee gap-10 whitespace-nowrap pr-10">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-10 font-display text-2xl uppercase">
              {t}
              <span className="text-signal">✺</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
