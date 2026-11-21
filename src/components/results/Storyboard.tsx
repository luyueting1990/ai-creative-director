"use client";

import { totalDuration } from "@/lib/editor";
import { photoForShot, type PhotoItem } from "@/lib/photos";
import { MAX_SHOTS, type Concept } from "@/lib/schema";
import { Icons, cx } from "../ui";

interface Props {
  concept: Concept;
  photos: PhotoItem[];
  targetSec: number;
  onEdit: (shotId: string) => void;
  onAdd: () => void;
}

export function Storyboard({ concept, photos, targetSec, onEdit, onAdd }: Props) {
  const shots = concept.shots;
  const total = totalDuration(shots);

  return (
    <section aria-label="Storyboard">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-bone">
          Storyboard <span className="text-mute">· {concept.title}</span>
        </h2>
        <p className="text-xs text-mute">
          {shots.length} shots · <span className={cx(total !== targetSec && "text-signal")}>{total}s</span>
          {total !== targetSec && ` of ${targetSec}s`} · Click a shot to edit
        </p>
      </div>

      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {shots.map((s, i) => {
          const photo = photoForShot(shots, i, photos);
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onEdit(s.id)}
                aria-label={`Edit shot ${i + 1}: ${s.title}`}
                className="group flex h-full w-full flex-col overflow-hidden rounded-xl bg-char text-left ring-1 ring-bone/10 transition hover:ring-bone/40 focus-visible:outline-2 focus-visible:outline-signal"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-char-2 sm:aspect-[4/5]">
                  {photo?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local object URLs can't use next/image
                    <img src={photo.url} alt={`Shot ${i + 1} reference: ${photo.name}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-mute">
                      {photo ? (
                        <>
                          <Icons.Image className="h-5 w-5" />
                          <span className="text-[11px]">Re-upload photo to preview</span>
                        </>
                      ) : !s.showsProduct && s.onScreenText ? (
                        <span className="font-display text-lg uppercase leading-tight text-bone">{s.onScreenText}</span>
                      ) : (
                        <>
                          <Icons.Film className="h-5 w-5" />
                          <span className="text-[11px]">{s.showsProduct ? "Add a product photo" : s.setting || "No image"}</span>
                        </>
                      )}
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded bg-ink/75 px-1.5 py-0.5 font-mono text-[10px] text-bone">{i + 1}</span>
                  <span className="absolute right-2 top-2 rounded bg-ink/75 px-1.5 py-0.5 font-mono text-[10px] text-bone">{s.durationSec}s</span>
                  {s.onScreenText && (photo?.url || s.showsProduct) && (
                    <span className="absolute inset-x-2 bottom-2 line-clamp-2 text-center text-xs font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                      {s.onScreenText}
                    </span>
                  )}
                  <span className="absolute inset-0 grid place-items-center bg-ink/50 opacity-0 transition group-hover:opacity-100" aria-hidden>
                    <span className="flex items-center gap-1.5 rounded-full bg-bone px-3 py-1.5 text-xs text-ink">
                      <Icons.Edit className="h-3.5 w-3.5" /> Edit
                    </span>
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <span className="text-sm font-medium leading-tight text-bone">{s.title}</span>
                  <span className="line-clamp-3 text-xs leading-snug text-mute">{s.description}</span>
                </div>
              </button>
            </li>
          );
        })}
        {shots.length < MAX_SHOTS && (
          <li>
            <button
              type="button"
              onClick={onAdd}
              className="flex h-full min-h-40 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-bone/20 text-sm text-mute transition hover:border-bone/50 hover:text-bone"
            >
              <Icons.Plus /> Add shot
            </button>
          </li>
        )}
      </ol>
    </section>
  );
}
