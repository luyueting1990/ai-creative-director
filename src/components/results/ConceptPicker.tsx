"use client";

import type { PhotoItem } from "@/lib/photos";
import type { Concept } from "@/lib/schema";
import { Icons, cx } from "../ui";

interface Props {
  concepts: Concept[];
  selectedId: string;
  onSelect: (id: string) => void;
  photos: PhotoItem[];
}

/** Three compact concept options. Choosing one updates the storyboard below in place. */
export function ConceptPicker({ concepts, selectedId, onSelect, photos }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Campaign concepts"
      className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0"
    >
      {concepts.map((c, i) => {
        const active = c.id === selectedId;
        const photo = photos.length ? photos[i % photos.length] : null;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(c.id)}
            className={cx(
              "group flex w-[78%] shrink-0 snap-start overflow-hidden rounded-xl text-left transition sm:w-auto",
              active ? "bg-bone text-ink ring-2 ring-signal" : "bg-char text-bone ring-1 ring-bone/10 hover:ring-bone/30",
            )}
          >
            <div className="relative w-24 shrink-0 bg-char-2 sm:w-28">
              {photo?.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URLs can't use next/image
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col" aria-hidden>
                  {c.palette.map((s) => (
                    <span key={s.hex + s.name} className="flex-1" style={{ background: s.hex }} />
                  ))}
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-3.5">
              <span className="flex items-center justify-between gap-2">
                <span className="font-display text-lg uppercase leading-tight">{c.title}</span>
                {active && <Icons.Check className="h-4 w-4 shrink-0 text-signal" />}
              </span>
              <span className={cx("mt-1 line-clamp-3 text-[13px] leading-snug", active ? "text-ink/70" : "text-mute")}>{c.idea}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
