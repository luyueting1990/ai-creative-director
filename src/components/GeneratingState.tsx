"use client";

import { useEffect, useState } from "react";
import { Button, Spinner } from "./ui";

const STAGES = [
  "Reading your brief",
  "Matching tone & category keywords",
  "Choosing three creative directions",
  "Building moodboards & palettes",
  "Boarding the films, frame by frame",
  "Writing shot lists, hooks & captions",
];

export function GeneratingState({ mode, brand, onCancel }: { mode: "demo" | "live"; brand: string; onCancel: () => void }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), mode === "demo" ? 320 : 9000);
    return () => clearInterval(t);
  }, [mode]);

  return (
    <section aria-live="polite" aria-busy="true" className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center px-4 py-16 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-mute">
        {mode === "demo" ? "Demo engine · illustrative output" : "Claude · live generation"}
      </p>
      <h2 className="mt-4 font-display text-[clamp(3rem,10vw,8rem)] uppercase leading-[0.85] tracking-tight">
        Directing
        <br />
        <span className="font-serif normal-case italic text-signal">{brand || "your brand"}</span>
      </h2>

      <ol className="mt-12 grid gap-3 sm:grid-cols-2">
        {STAGES.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-3 border-t pt-3 text-sm transition-all duration-500 ${
              i < stage ? "border-bone/30 text-bone/50" : i === stage ? "border-signal text-bone" : "border-bone/10 text-bone/25"
            }`}
          >
            <span className="font-mono text-[11px] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            {s}
            {i === stage && <Spinner className="ml-auto h-3.5 w-3.5 text-signal" />}
            {i < stage && <span className="ml-auto font-mono text-[10px] text-acid">DONE</span>}
          </li>
        ))}
      </ol>

      <div className="mt-10 flex items-center gap-4">
        {mode === "live" && <p className="text-xs text-mute">This can take a minute.</p>}
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
