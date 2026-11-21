"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { LINK_LABELS, classifyLink, displayLink, isHttpUrl, normalizeUrlInput, type LinkKind } from "@/lib/links";
import { MAX_LINKS } from "@/lib/schema";
import { Icons, cx } from "../ui";

interface Props {
  label: string;
  hint: string;
  placeholder: string;
  value: string[];
  onChange: (links: string[]) => void;
  allowed?: LinkKind[];
  error?: string;
}

const KIND_STYLE: Record<LinkKind, string> = {
  instagram: "bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white",
  tiktok: "bg-bone text-ink",
  youtube: "bg-[#ff0033] text-white",
  website: "bg-lilac text-ink",
};

export function LinkListInput({ label, hint, placeholder, value, onChange, allowed, error }: Props) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function add() {
    const url = normalizeUrlInput(draft);
    if (!url) return;
    if (!isHttpUrl(url)) return setLocalError("Enter a full link, e.g. https://instagram.com/yourbrand");
    const kind = classifyLink(url);
    if (allowed && !allowed.includes(kind)) {
      return setLocalError(`Only ${allowed.map((k) => LINK_LABELS[k]).join(", ")} links work here.`);
    }
    if (value.includes(url)) return setLocalError("That link is already added.");
    if (value.length >= MAX_LINKS) return setLocalError(`Add up to ${MAX_LINKS} links.`);
    onChange([...value, url]);
    setDraft("");
    setLocalError(null);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  }

  const shownError = localError ?? error;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-bone">
          {label}
        </label>
        <span className="font-mono text-[10px] uppercase tracking-widest text-mute">Optional</span>
      </div>
      <p className="mb-2.5 text-xs text-mute">{hint}</p>
      <div className="flex gap-2">
        <input
          id={id}
          type="url"
          inputMode="url"
          value={draft}
          placeholder={placeholder}
          aria-invalid={Boolean(shownError)}
          aria-describedby={shownError ? `${id}-error` : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            if (localError) setLocalError(null);
          }}
          onKeyDown={onKey}
          onBlur={() => draft.trim() && add()}
          className={cx(
            "h-11 min-w-0 flex-1 rounded-lg border bg-char-2 px-3.5 text-sm text-bone placeholder:text-bone/25",
            "focus:border-bone/50 focus:outline-none focus:ring-4 focus:ring-signal/15",
            shownError ? "border-signal" : "border-bone/10",
          )}
        />
        <button
          type="button"
          onClick={add}
          aria-label={`Add ${label.toLowerCase()}`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-bone/15 text-bone transition hover:border-bone/50 hover:bg-bone/5"
        >
          <Icons.Plus />
        </button>
      </div>
      {shownError && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-signal">
          {shownError}
        </p>
      )}
      {value.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={`${label} added`}>
          {value.map((url) => {
            const kind = classifyLink(url);
            return (
              <li
                key={url}
                className="flex max-w-full items-center gap-2 rounded-full border border-bone/10 bg-char-2 py-1 pl-1 pr-1.5 text-xs"
              >
                <span className={cx("rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider", KIND_STYLE[kind])}>
                  {LINK_LABELS[kind]}
                </span>
                <span className="truncate text-bone/80">{displayLink(url)}</span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((v) => v !== url))}
                  aria-label={`Remove ${displayLink(url)}`}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-mute hover:bg-signal hover:text-ink"
                >
                  <Icons.X className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export { KIND_STYLE };
