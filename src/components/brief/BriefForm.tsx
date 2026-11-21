"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { PhotoItem } from "@/lib/photos";
import {
  BriefSchema,
  DEFAULT_DURATION,
  DEFAULT_PLATFORMS,
  DURATIONS,
  PLATFORMS,
  PLATFORM_LABELS,
  type BriefInput,
  type Platform,
} from "@/lib/schema";
import { Button, Icons, Spinner, cx } from "../ui";
import { LinkListInput } from "./LinkListInput";
import { PhotoUploader } from "./PhotoUploader";

type FieldKey = keyof BriefInput;
type Errors = Partial<Record<FieldKey, string>>;
type TextKey = "brandName" | "brandDescription" | "productDescription" | "goal" | "audience";

interface Props {
  value: BriefInput;
  onChange: (brief: BriefInput) => void;
  photos: PhotoItem[];
  onAddPhotos: (files: File[]) => string[];
  onRemovePhoto: (id: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  loading: boolean;
  submitLabel?: string;
}

const inputClass = (err?: string) =>
  cx(
    "w-full rounded-lg border bg-char-2 px-3.5 py-2.5 text-[15px] text-bone placeholder:text-bone/30 transition",
    "focus:border-bone/50 focus:outline-none focus:ring-4 focus:ring-signal/15",
    err ? "border-signal" : "border-bone/10",
  );

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-bone">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-signal">
          {error}
        </p>
      )}
    </div>
  );
}

function Chip({ active, onClick, children, ...rest }: { active: boolean; onClick: () => void; children: ReactNode } & Record<string, unknown>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-full px-3.5 py-1.5 text-sm transition",
        active ? "bg-bone text-ink" : "border border-bone/15 text-bone/70 hover:border-bone/50 hover:text-bone",
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function BriefForm({ value, onChange, photos, onAddPhotos, onRemovePhoto, onSubmit, onCancel, loading, submitLabel = "Create Campaign" }: Props) {
  const [errors, setErrors] = useState<Errors>({});
  const optionalCount =
    (value.links?.length ? 1 : 0) + (value.platforms?.length ? 1 : 0) + (value.audience ? 1 : 0) + (value.durationSec ? 1 : 0);

  function set<K extends FieldKey>(key: K, v: BriefInput[K]) {
    onChange({ ...value, [key]: v });
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function togglePlatform(p: Platform) {
    const current = value.platforms ?? [];
    set("platforms", current.includes(p) ? current.filter((x) => x !== p) : PLATFORMS.filter((x) => x === p || current.includes(x)));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = BriefSchema.safeParse(value);
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) next[issue.path[0] as FieldKey] ??= issue.message;
      setErrors(next);
      const first = (["brandName", "brandDescription", "productDescription", "goal"] as const).find((k) => next[k]);
      if (first) requestAnimationFrame(() => document.getElementById(`brief-${first}`)?.focus());
      return;
    }
    setErrors({});
    onSubmit();
  }

  const text = (key: TextKey) => ({
    id: `brief-${key}`,
    name: key,
    value: value[key] ?? "",
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `brief-${key}-error` : undefined,
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
    className: inputClass(errors[key]),
  });

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Campaign brief" className="space-y-5">
      <Field id="brief-brandName" label="Brand name" error={errors.brandName}>
        <input type="text" autoComplete="organization" placeholder="e.g. Atelier Noor" {...text("brandName")} />
      </Field>
      <Field id="brief-brandDescription" label="About the brand" error={errors.brandDescription}>
        <textarea rows={3} placeholder="What you make, who for, and how it should feel." {...text("brandDescription")} />
      </Field>
      <Field id="brief-productDescription" label="Product details" error={errors.productDescription}>
        <textarea rows={2} placeholder="The product or collection this campaign is for." {...text("productDescription")} />
      </Field>

      <PhotoUploader photos={photos} onAdd={onAddPhotos} onRemove={onRemovePhoto} />

      <Field id="brief-goal" label="Campaign goal" error={errors.goal}>
        <input type="text" placeholder="e.g. Launch the collection and drive pre-orders" {...text("goal")} />
      </Field>

      <details className="group rounded-lg border border-bone/10 open:bg-char/50" open={optionalCount > 0 || undefined}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm text-bone/80 hover:text-bone">
          <span>
            Optional: links, platforms, audience, length
            {optionalCount > 0 && <span className="ml-2 text-xs text-mute">({optionalCount} set)</span>}
          </span>
          <Icons.Chevron className="h-4 w-4 transition group-open:rotate-180" />
        </summary>
        <div className="space-y-5 border-t border-bone/10 px-4 pb-5 pt-4">
          <LinkListInput value={value.links ?? []} onChange={(v) => set("links", v)} error={errors.links} />

          <fieldset>
            <legend className="mb-1 text-sm font-medium text-bone">Platforms</legend>
            <p className="mb-2 text-xs text-mute">Default: {DEFAULT_PLATFORMS.map((p) => PLATFORM_LABELS[p]).join(" + ")}</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <Chip key={p} active={(value.platforms ?? []).includes(p)} onClick={() => togglePlatform(p)} aria-pressed={(value.platforms ?? []).includes(p)}>
                  {PLATFORM_LABELS[p]}
                </Chip>
              ))}
            </div>
          </fieldset>

          <Field id="brief-audience" label="Target audience" error={errors.audience}>
            <input type="text" placeholder="e.g. Creative professionals aged 25–40" {...text("audience")} />
          </Field>

          <fieldset>
            <legend className="mb-1 text-sm font-medium text-bone">Video length</legend>
            <p className="mb-2 text-xs text-mute">Default: {DEFAULT_DURATION}s</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Video length">
              {DURATIONS.map((d) => (
                <Chip
                  key={d}
                  active={value.durationSec === d}
                  onClick={() => set("durationSec", value.durationSec === d ? undefined : d)}
                  role="radio"
                  aria-checked={value.durationSec === d}
                >
                  {d}s
                </Chip>
              ))}
            </div>
          </fieldset>
        </div>
      </details>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="signal" size="lg" disabled={loading}>
          {loading ? <Spinner /> : <Icons.Sparkle />}
          {loading ? "Creating…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
