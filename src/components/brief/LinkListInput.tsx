"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { LINK_LABELS, classifyLink, displayLink, isHttpUrl, normalizeUrlInput } from "@/lib/links";
import { MAX_LINKS } from "@/lib/schema";
import { Icons, cx } from "../ui";

interface Props {
  value: string[];
  onChange: (links: string[]) => void;
  error?: string;
}

/** One field for all reference links; each link is labelled automatically (Instagram, TikTok, YouTube, Website). */
export function LinkListInput({ value, onChange, error }: Props) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function add() {
    const url = normalizeUrlInput(draft);
    if (!url) return;
    if (!isHttpUrl(url)) return setLocalError("Enter a full link, e.g. instagram.com/yourbrand");
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
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-bone">
        Reference links
      </label>
      <p className="mb-2 text-xs text-mute">Instagram, TikTok, YouTube or your website. Saved with the project; not opened by the demo.</p>
      <div className="flex gap-2">
        <input
          id={id}
          type="url"
          inputMode="url"
          value={draft}
          placeholder="Paste a link and press Enter"
          aria-invalid={Boolean(shownError)}
          aria-describedby={shownError ? `${id}-error` : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            if (localError) setLocalError(null);
          }}
          onKeyDown={onKey}
          onBlur={() => draft.trim() && add()}
          className={cx(
            "h-11 min-w-0 flex-1 rounded-lg border bg-char-2 px-3.5 text-sm text-bone placeholder:text-bone/30",
            "focus:border-bone/50 focus:outline-none focus:ring-4 focus:ring-signal/15",
            shownError ? "border-signal" : "border-bone/10",
          )}
        />
        <button
          type="button"
          onClick={add}
          aria-label="Add link"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-bone/15 text-bone transition hover:border-bone/50"
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
        <ul className="mt-2.5 flex flex-wrap gap-2" aria-label="Added links">
          {value.map((url) => (
            <li key={url} className="flex max-w-full items-center gap-2 rounded-full border border-bone/10 py-1 pl-2.5 pr-1 text-xs">
              <span className="font-mono text-[9px] uppercase tracking-wider text-mute">{LINK_LABELS[classifyLink(url)]}</span>
              <span className="truncate text-bone/85">{displayLink(url)}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== url))}
                aria-label={`Remove ${displayLink(url)}`}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-mute hover:bg-bone/10 hover:text-bone"
              >
                <Icons.X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
