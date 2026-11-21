"use client";

import { useEffect, useRef } from "react";
import type { Project } from "@/lib/schema";
import { Button, IconButton, Icons, cx } from "./ui";

interface Props {
  open: boolean;
  projects: Project[];
  currentId?: string;
  onClose: () => void;
  onOpenProject: (p: Project) => void;
  onDelete: (id: string) => void;
  onImport: (file: File) => void;
}

export function ProjectsDrawer({ open, projects, currentId, onClose, onOpenProject, onDelete, onImport }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={cx("fixed inset-0 z-50", !open && "pointer-events-none invisible")} aria-hidden={!open}>
      <div
        className={cx("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Saved projects"
        className={cx(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-bone/10 bg-char shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-bone/10 px-6 py-5">
          <div>
            <h2 className="font-display text-4xl uppercase">Projects</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Saved in this browser</p>
          </div>
          <IconButton ref={closeRef} label="Close projects" onClick={onClose}>
            <Icons.X />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {projects.length === 0 ? (
            <div className="mt-16 text-center text-sm text-mute">
              <Icons.Folder className="mx-auto mb-3 h-6 w-6" />
              No saved projects yet.
              <br />
              Create a campaign and press <strong className="font-medium text-bone">Save</strong>.
            </div>
          ) : (
            <ul className="space-y-2">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className={cx(
                    "group flex items-stretch overflow-hidden rounded-xl bg-ink ring-1 transition hover:ring-bone/40",
                    p.id === currentId ? "ring-signal" : "ring-bone/10",
                  )}
                >
                  <div className="flex w-2 flex-col" aria-hidden>
                    {(p.campaign.concepts[0]?.palette ?? []).slice(0, 4).map((s) => (
                      <span key={s.hex} className="flex-1" style={{ background: s.hex }} />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenProject(p)}
                    className="min-w-0 flex-1 px-4 py-3 text-left"
                  >
                    <p className="truncate font-medium text-bone">{p.name}</p>
                    <p className="truncate text-xs text-mute">
                      {p.campaign.concepts.map((c) => c.title).join(" · ")}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-mute">
                      {p.campaign.source === "claude" ? "Claude" : "Demo"} · {p.photos.length} photos ·{" "}
                      {new Date(p.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </button>
                  <div className="flex items-center pr-2">
                    <IconButton
                      label={`Delete project ${p.name}`}
                      onClick={() => {
                        if (window.confirm(`Delete "${p.name}"? This can't be undone.`)) onDelete(p.id);
                      }}
                      className="hover:!text-signal"
                    >
                      <Icons.Trash className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 border-t border-bone/10 p-4">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
          <Button className="w-full" onClick={() => fileRef.current?.click()}>
            <Icons.Upload /> Import project JSON
          </Button>
          <p className="text-center text-[11px] leading-relaxed text-mute">
            Photo previews aren&apos;t stored. Reopened projects show file names until you re-attach photos.
          </p>
        </div>
      </aside>
    </div>
  );
}
