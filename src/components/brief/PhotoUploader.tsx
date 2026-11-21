"use client";

import { useRef, useState, type DragEvent } from "react";
import type { PhotoItem } from "@/lib/photos";
import { MAX_PHOTOS } from "@/lib/schema";
import { Icons, cx } from "../ui";

interface Props {
  photos: PhotoItem[];
  onAdd: (files: File[]) => string[];
  onRemove: (id: string) => void;
}

export function PhotoUploader({ photos, onAdd, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const full = photos.length >= MAX_PHOTOS;

  function handle(files: FileList | null) {
    if (!files?.length) return;
    setErrors(onAdd(Array.from(files)));
  }

  const dropProps = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handle(e.dataTransfer.files);
    },
  };

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-bone" id="photos-label">
          Product photos
        </span>
        <span className="text-xs text-mute">
          {photos.length}/{MAX_PHOTOS} · optional
        </span>
      </div>
      <p className="mb-2 text-xs text-mute">Used as images in your storyboard. They stay in your browser and aren&apos;t analysed.</p>

      {photos.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          {...dropProps}
          className={cx(
            "flex w-full items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-6 text-sm transition",
            dragging ? "border-signal bg-signal/10 text-bone" : "border-bone/20 text-mute hover:border-bone/50 hover:text-bone",
          )}
        >
          <Icons.Upload className="h-5 w-5" />
          Drop photos or click to upload
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {photos.map((p, i) => (
            <figure key={p.id} className="group relative aspect-square overflow-hidden rounded-md bg-char-2">
              {p.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URLs can't use next/image
                <img src={p.url} alt={`Product reference ${i + 1}: ${p.name}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center p-1 text-center text-[10px] text-mute">
                  <Icons.Image className="h-4 w-4" />
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                aria-label={`Remove photo ${p.name}`}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/80 text-bone transition hover:bg-signal hover:text-ink"
              >
                <Icons.X className="h-3 w-3" />
              </button>
            </figure>
          ))}
          {!full && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              {...dropProps}
              aria-label="Add more photos"
              className={cx(
                "grid aspect-square place-items-center rounded-md border border-dashed transition",
                dragging ? "border-signal text-bone" : "border-bone/20 text-mute hover:border-bone/50 hover:text-bone",
              )}
            >
              <Icons.Plus />
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        id="brief-photos"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        aria-label="Upload product photos"
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />

      {errors.length > 0 && (
        <ul role="alert" className="mt-2 space-y-1 text-xs text-signal">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
