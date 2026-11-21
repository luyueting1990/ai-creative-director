"use client";

import type { ReactNode } from "react";
import type { PhotoItem } from "@/lib/photos";
import { IconButton, Icons, cx } from "../ui";

export function SectionHeading({
  index,
  title,
  kicker,
  children,
}: {
  index: string;
  title: ReactNode;
  kicker?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-mute">
          <span className="text-signal">{index}</span> {kicker && `/ ${kicker}`}
        </p>
        <h2 className="mt-3 font-display text-[clamp(2.6rem,7vw,5.5rem)] uppercase leading-[0.88] tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/** A photo tile that degrades to a labelled placeholder when the in-memory preview is gone. */
export function PhotoTile({ photo, className, label }: { photo: PhotoItem; className?: string; label?: string }) {
  return (
    <figure className={cx("relative overflow-hidden bg-char-2", className)}>
      {photo.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- local object URLs can't use next/image
        <img src={photo.url} alt={label ?? `Product reference: ${photo.name}`} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-3 text-center text-[11px] text-mute">
          <Icons.Image className="h-5 w-5" />
          <span className="line-clamp-2 break-all">{photo.name}</span>
          <span className="font-mono text-[9px] uppercase tracking-wider">Re-upload to preview</span>
        </div>
      )}
    </figure>
  );
}

export function RowControls({
  index,
  length,
  noun,
  onMove,
  onRemove,
  onInsert,
}: {
  index: number;
  length: number;
  noun: string;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
  onInsert?: () => void;
}) {
  return (
    <div className="flex items-center">
      <IconButton label={`Move ${noun} ${index + 1} up`} disabled={index === 0} onClick={() => onMove(-1)}>
        <Icons.Up className="h-3.5 w-3.5" />
      </IconButton>
      <IconButton label={`Move ${noun} ${index + 1} down`} disabled={index === length - 1} onClick={() => onMove(1)}>
        <Icons.Down className="h-3.5 w-3.5" />
      </IconButton>
      {onInsert && (
        <IconButton label={`Insert ${noun} after ${index + 1}`} onClick={onInsert}>
          <Icons.Plus className="h-3.5 w-3.5" />
        </IconButton>
      )}
      <IconButton label={`Delete ${noun} ${index + 1}`} onClick={onRemove} className="hover:!text-signal">
        <Icons.Trash className="h-3.5 w-3.5" />
      </IconButton>
    </div>
  );
}

export function DurationInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <label className="inline-flex shrink-0 items-center rounded-full border border-current/20 px-2 py-0.5 font-mono text-[11px] tabular-nums">
      <input
        type="number"
        min={0}
        max={120}
        step={0.5}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(Math.min(120, Math.max(0, Number(e.target.value) || 0)))}
        className="w-8 bg-transparent text-right focus:outline-none"
      />
      s
    </label>
  );
}

export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-50">{label}</p>
      {children}
    </div>
  );
}

export function NextStep({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="mt-16 flex justify-end border-t border-bone/10 pt-8">
      <button
        type="button"
        onClick={onClick}
        className="group flex items-center gap-4 text-right focus-visible:outline-2 focus-visible:outline-acid"
      >
        <span>
          <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-mute">Next</span>
          <span className="block font-display text-3xl uppercase transition group-hover:text-signal sm:text-4xl">{label}</span>
        </span>
        <span className="grid h-12 w-12 place-items-center rounded-full bg-signal text-ink transition-transform group-hover:translate-x-1">
          <Icons.Right />
        </span>
      </button>
    </div>
  );
}

export function Swatches({ palette, className }: { palette: { name: string; hex: string }[]; className?: string }) {
  return (
    <div className={cx("flex", className)} aria-label="Colour palette">
      {palette.map((s) => (
        <span key={s.hex + s.name} className="flex-1" style={{ background: s.hex }} title={`${s.name} ${s.hex}`} />
      ))}
    </div>
  );
}

/** Picks ink or bone text for legibility on a swatch colour. */
export function readableOn(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#0a0a0b" : "#f2ede4";
}
