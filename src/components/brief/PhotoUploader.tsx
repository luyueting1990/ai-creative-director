"use client";

import { useRef, useState, type DragEvent } from "react";
import { formatBytes, type PhotoItem } from "@/lib/photos";
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

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handle(e.dataTransfer.files);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {photos.map((p, i) => (
          <figure
            key={p.id}
            className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-bone/10 bg-char-2"
          >
            {p.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URLs can't use next/image
              <img src={p.url} alt={`Product reference ${i + 1}: ${p.name}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-xs text-mute">
                <Icons.Image className="h-6 w-6" />
                Preview unavailable after refresh
              </div>
            )}
            <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-ink/90 to-transparent p-2.5 pt-8">
              <span className="min-w-0">
                <span className="block truncate text-[11px] text-bone">{p.name}</span>
                <span className="font-mono text-[10px] text-mute">{formatBytes(p.size)}</span>
              </span>
              <span className="font-mono text-[10px] text-bone/60">{String(i + 1).padStart(2, "0")}</span>
            </figcaption>
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              aria-label={`Remove photo ${p.name}`}
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink/80 text-bone backdrop-blur transition hover:bg-signal hover:text-ink focus-visible:outline-2 focus-visible:outline-acid"
            >
              <Icons.X className="h-3.5 w-3.5" />
            </button>
          </figure>
        ))}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cx(
              "flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-4 text-center transition",
              dragging ? "border-acid bg-acid/10 text-acid" : "border-bone/25 text-mute hover:border-bone/60 hover:text-bone",
              photos.length === 0 && "col-span-3 aspect-auto min-h-44 sm:col-span-4 lg:col-span-6",
            )}
          >
            <Icons.Upload className="h-6 w-6" />
            <span className="text-sm">
              {photos.length === 0 ? "Drop product photos here or click to browse" : "Add photo"}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest">
              {photos.length}/{MAX_PHOTOS}
              {photos.length === 0 && " · JPG PNG WebP · 10MB max"}
            </span>
          </button>
        )}
      </div>

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
        <ul role="alert" className="mt-3 space-y-1 text-xs text-signal">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 flex items-start gap-2 text-xs text-mute">
        <Icons.Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Photos stay in your browser as visual references. They are not uploaded or analysed, and previews
        disappear if you refresh the page (file names are saved with the project).
      </p>
    </div>
  );
}
