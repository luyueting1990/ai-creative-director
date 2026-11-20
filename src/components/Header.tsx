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
    <header className="sticky top-0 z-30 border-b border-line/80 bg-ivory/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <button type="button" onClick={onNew} className="group flex items-center gap-3" aria-label="New campaign">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink font-display text-sm italic text-ivory transition group-hover:rotate-6">
            cd
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block font-display text-[17px] tracking-tight">Creative Director</span>
            <span className="block text-[10px] uppercase tracking-[0.22em] text-muted">AI campaign studio</span>
          </span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            role="radiogroup"
            aria-label="Generation mode"
            className="flex rounded-full bg-white/70 p-1 ring-1 ring-line"
          >
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
                      ? "Set ANTHROPIC_API_KEY on the server to enable live Claude generation"
                      : m === "live"
                        ? `Generate with ${model}`
                        : "Instant sample output, no API key"
                  }
                  className={cx(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                    mode === m ? "bg-ink text-ivory shadow" : "text-ink/60 hover:text-ink",
                    disabled && "cursor-not-allowed opacity-40 hover:text-ink/60",
                  )}
                >
                  {m === "live" && (
                    <span
                      className={cx(
                        "h-1.5 w-1.5 rounded-full",
                        liveAvailable ? "bg-emerald-500" : "bg-ink/30",
                      )}
                      aria-hidden
                    />
                  )}
                  {m === "demo" ? "Demo" : "Live · Claude"}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenProjects}
            aria-label={`Projects (${projectCount})`}
            className="flex h-9 items-center gap-2 rounded-full px-3 text-sm text-ink/70 ring-1 ring-line transition hover:bg-white hover:text-ink"
          >
            <Icons.Folder />
            <span className="hidden sm:inline">Projects</span>
            <span className="rounded-full bg-ink/5 px-1.5 text-[11px] tabular-nums">{projectCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
