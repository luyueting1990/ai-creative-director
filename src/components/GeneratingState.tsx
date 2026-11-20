"use client";

import { useEffect, useState } from "react";
import { Spinner } from "./ui";

const STAGES = [
  "Reading the brief",
  "Finding three strategic angles",
  "Building visual worlds & palettes",
  "Boarding the films frame by frame",
  "Writing the shot lists",
  "Drafting platform-native captions",
];

export function GeneratingState({ mode }: { mode: "demo" | "live" }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setStage((s) => Math.min(s + 1, STAGES.length - 1)),
      mode === "demo" ? 220 : 9000,
    );
    return () => clearInterval(t);
  }, [mode]);

  return (
    <div aria-live="polite" aria-busy="true" className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-ink/80">
        <Spinner />
        <span className="font-display text-lg italic">{STAGES[stage]}…</span>
        {mode === "live" && <span className="text-xs text-muted">Claude is working — this can take a minute.</span>}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
            <div className="skeleton h-20" />
            <div className="space-y-3 p-5">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-6 w-3/4 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-5/6 rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
