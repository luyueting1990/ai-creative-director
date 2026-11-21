"use client";

import { Icons, cx } from "./ui";

interface Props {
  mode: "demo" | "live";
  onModeChange: (mode: "demo" | "live") => void;
  liveAvailable: boolean;
  model: string;
  projectCount: number;
  onOpenProjects: () => void;
  onNew: () => void;
}

export function Header({ mode, onModeChange, liveAvailable, model, projectCount, onOpenProjects, onNew }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-bone/10 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-8">
        <button type="button" onClick={onNew} className="group flex items-center gap-3" aria-label="Start a new campaign">
          <span className="grid h-9 w-9 place-items-center bg-signal font-display text-lg leading-none text-ink transition-transform group-hover:-rotate-6">
            CD
          </span>
          <span className="hidden leading-none sm:block">
            <span className="block font-display text-lg uppercase tracking-wide">Creative Director</span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.3em] text-mute">AI campaign studio</span>
          </span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div role="radiogroup" aria-label="Generation mode" className="flex rounded-full border border-bone/15 p-1">
            {(["demo", "live"] as const).map((m) => {
              const disabled = m === "live" && !liveAvailable;
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  disabled={disabled}
                  onClick={() => onModeChange(m)}
                  title={
                    disabled
                      ? "Live AI generation needs ANTHROPIC_API_KEY on the server. Demo mode works without it."
                      : m === "live"
                        ? `Generate with ${model}`
                        : "Illustrative output, no API key needed"
                  }
                  className={cx(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition",
                    mode === m ? (m === "demo" ? "bg-acid text-ink" : "bg-bone text-ink") : "text-bone/60 hover:text-bone",
                    disabled && "cursor-not-allowed opacity-35 hover:text-bone/60",
                  )}
                >
                  {m === "live" && (
                    <span className={cx("h-1.5 w-1.5 rounded-full", liveAvailable ? "bg-emerald-400" : "bg-bone/40")} aria-hidden />
                  )}
                  {m === "demo" ? "Demo" : "Live AI"}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenProjects}
            aria-label={`Projects (${projectCount})`}
            className="flex h-9 items-center gap-2 rounded-full border border-bone/15 px-3 text-sm text-bone/80 transition hover:border-bone/50 hover:text-bone"
          >
            <Icons.Folder />
            <span className="hidden md:inline">Projects</span>
            <span className="rounded-full bg-bone/10 px-1.5 font-mono text-[10px] tabular-nums">{projectCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
