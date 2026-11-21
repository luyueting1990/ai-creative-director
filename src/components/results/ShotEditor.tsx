"use client";

import { useEffect, useRef, type Dispatch } from "react";
import type { EditorAction } from "@/lib/editor";
import { photoForShot, type PhotoItem } from "@/lib/photos";
import type { Concept } from "@/lib/schema";
import { Button, IconButton, Icons, cx } from "../ui";

interface Props {
  concept: Concept;
  shotId: string;
  photos: PhotoItem[];
  dispatch: Dispatch<EditorAction>;
  onClose: () => void;
}

const field =
  "w-full rounded-lg border border-bone/10 bg-char-2 px-3 py-2 text-sm text-bone placeholder:text-bone/30 focus:border-bone/50 focus:outline-none focus:ring-4 focus:ring-signal/15";

/** Compact dialog for editing one shot. Changes apply immediately. */
export function ShotEditor({ concept, shotId, photos, dispatch, onClose }: Props) {
  const index = concept.shots.findIndex((s) => s.id === shotId);
  const shot = concept.shots[index];
  const firstField = useRef<HTMLInputElement>(null);

  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  // Focus once when the dialog opens; Escape closes it.
  useEffect(() => {
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!shot) return null;
  const base = { conceptId: concept.id, list: "shots" as const, itemId: shot.id };
  const patch = (p: Record<string, unknown>) => dispatch({ ...base, type: "updateItem", patch: p });
  const current = photoForShot(concept.shots, index, photos);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit shot ${index + 1}`}
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-bone/10 bg-char p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-bone">
            Shot {index + 1} <span className="text-mute">of {concept.shots.length}</span>
          </h2>
          <IconButton label="Close editor" onClick={onClose}>
            <Icons.X />
          </IconButton>
        </div>

        <div className="space-y-4">
          <fieldset>
            <legend className="mb-1.5 text-xs text-mute">Image</legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => patch({ photoId: "none" })}
                aria-pressed={shot.photoId === "none"}
                className={cx(
                  "grid h-14 w-14 place-items-center rounded-md border text-[10px] text-mute",
                  shot.photoId === "none" ? "border-signal text-bone" : "border-bone/15 hover:border-bone/40",
                )}
              >
                None
              </button>
              {photos.map((p, i) => {
                const selected = current?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => patch({ photoId: p.id })}
                    aria-pressed={selected}
                    aria-label={`Use photo ${i + 1}: ${p.name}`}
                    className={cx("h-14 w-14 overflow-hidden rounded-md border-2 bg-char-2", selected ? "border-signal" : "border-transparent hover:border-bone/40")}
                  >
                    {p.url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local object URLs can't use next/image
                      <img src={p.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-mute">{i + 1}</span>
                    )}
                  </button>
                );
              })}
              {photos.length === 0 && <p className="self-center text-xs text-mute">Add photos in the brief to use them here.</p>}
            </div>
          </fieldset>

          <div className="grid grid-cols-[1fr_6rem] gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-mute">Title</span>
              <input ref={firstField} className={field} value={shot.title} onChange={(e) => patch({ title: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-mute">Seconds</span>
              <input
                type="number"
                min={0.5}
                max={60}
                step={0.5}
                className={field}
                value={shot.durationSec}
                onChange={(e) => patch({ durationSec: Math.min(60, Math.max(0, Number(e.target.value) || 0)) })}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-mute">What we see</span>
            <textarea rows={3} className={field} value={shot.description} onChange={(e) => patch({ description: e.target.value })} />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-mute">On-screen text (optional)</span>
            <input className={field} value={shot.onScreenText} onChange={(e) => patch({ onScreenText: e.target.value })} />
          </label>

          <label className="flex items-center gap-2 text-sm text-bone/80">
            <input
              type="checkbox"
              checked={shot.showsProduct}
              onChange={(e) => patch({ showsProduct: e.target.checked })}
              className="h-4 w-4 accent-[#ff4d2e]"
            />
            Shows the product
          </label>

          <details className="rounded-lg border border-bone/10">
            <summary className="cursor-pointer px-3 py-2 text-xs text-mute hover:text-bone">Production notes</summary>
            <div className="space-y-3 border-t border-bone/10 p-3">
              {(
                [
                  ["camera", "Camera"],
                  ["setting", "Setting"],
                  ["direction", "Direction"],
                ] as const
              ).map(([k, l]) => (
                <label key={k} className="block">
                  <span className="mb-1 block text-xs text-mute">{l}</span>
                  <input className={field} value={shot[k]} onChange={(e) => patch({ [k]: e.target.value })} />
                </label>
              ))}
            </div>
          </details>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-bone/10 pt-4">
          <div className="flex items-center">
            <IconButton label="Move shot earlier" disabled={index === 0} onClick={() => dispatch({ ...base, type: "moveItem", direction: -1 })}>
              <Icons.Left className="h-4 w-4" />
            </IconButton>
            <IconButton
              label="Move shot later"
              disabled={index === concept.shots.length - 1}
              onClick={() => dispatch({ ...base, type: "moveItem", direction: 1 })}
            >
              <Icons.Right className="h-4 w-4" />
            </IconButton>
            <Button
              variant="danger"
              size="sm"
              disabled={concept.shots.length <= 1}
              onClick={() => {
                dispatch({ ...base, type: "removeItem" });
                onClose();
              }}
            >
              <Icons.Trash className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
