"use client";

import { useState, type FormEvent } from "react";
import { SAMPLE_BRIEFS } from "@/lib/samples";
import { BriefSchema, PLATFORMS, PLATFORM_LABELS, type BriefInput, type Platform } from "@/lib/schema";
import { Button, Icons, Spinner, cx } from "./ui";

type FieldKey = keyof BriefInput;

interface Props {
  value: BriefInput;
  onChange: (brief: BriefInput) => void;
  onSubmit: () => void;
  loading: boolean;
  mode: "demo" | "live";
  compact?: boolean;
}

const FIELDS: {
  key: Exclude<FieldKey, "platforms">;
  label: string;
  placeholder: string;
  multiline?: boolean;
  optional?: boolean;
}[] = [
  { key: "brandName", label: "Brand", placeholder: "e.g. Maison Verre" },
  { key: "collection", label: "Collection or product", placeholder: "e.g. SS27 \"Salt Light\" linen collection" },
  {
    key: "audience",
    label: "Target audience",
    placeholder: "Who are we talking to? Age, mindset, what they value",
    multiline: true,
  },
  { key: "goal", label: "Campaign goal", placeholder: "e.g. Launch the collection and drive pre-orders", multiline: true },
  { key: "tone", label: "Brand tone", placeholder: "e.g. Calm, poetic, understated luxury" },
  {
    key: "notes",
    label: "Notes & mandatories",
    placeholder: "Product truths, things to avoid, references…",
    multiline: true,
    optional: true,
  },
];

export function BriefForm({ value, onChange, onSubmit, loading, mode, compact }: Props) {
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  function set<K extends FieldKey>(key: K, v: BriefInput[K]) {
    onChange({ ...value, [key]: v });
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function togglePlatform(p: Platform) {
    const has = value.platforms.includes(p);
    set(
      "platforms",
      has ? value.platforms.filter((x) => x !== p) : PLATFORMS.filter((x) => x === p || value.platforms.includes(x)),
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = BriefSchema.safeParse(value);
    if (!result.success) {
      const next: Partial<Record<FieldKey, string>> = {};
      for (const issue of result.error.issues) {
        const k = issue.path[0] as FieldKey;
        next[k] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-label="Campaign brief">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Try a sample</span>
        {SAMPLE_BRIEFS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              onChange({ ...s.brief });
              setErrors({});
            }}
            className="rounded-full border border-line bg-white/60 px-3 py-1 text-xs text-ink/80 transition hover:border-ink/30 hover:bg-white"
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={cx("grid gap-4", !compact && "sm:grid-cols-2")}>
        {FIELDS.map((f) => {
          const id = `brief-${f.key}`;
          const err = errors[f.key];
          const full = f.multiline || f.key === "collection";
          const common = {
            id,
            name: f.key,
            value: value[f.key] ?? "",
            placeholder: f.placeholder,
            "aria-invalid": Boolean(err),
            "aria-describedby": err ? `${id}-error` : undefined,
            onChange: (e: { target: { value: string } }) => set(f.key, e.target.value),
            className: cx(
              "w-full rounded-xl border bg-white/80 px-3.5 py-2.5 text-sm text-ink shadow-sm transition",
              "placeholder:text-ink/35 focus:border-ink/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-accent/10",
              err ? "border-red-400" : "border-line",
            ),
          };
          return (
            <div key={f.key} className={cx(full && !compact && "sm:col-span-2")}>
              <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-xs font-medium text-ink/80">
                {f.label}
                {f.optional && <span className="font-normal text-muted">Optional</span>}
              </label>
              {f.multiline ? <textarea rows={2} {...common} /> : <input type="text" {...common} />}
              {err && (
                <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
                  {err}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-medium text-ink/80">Platforms</legend>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const active = value.platforms.includes(p);
            return (
              <button
                key={p}
                type="button"
                aria-pressed={active}
                onClick={() => togglePlatform(p)}
                className={cx(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition",
                  active ? "bg-ink text-ivory" : "bg-white/70 text-ink/70 ring-1 ring-line hover:ring-ink/30",
                )}
              >
                {PLATFORM_LABELS[p]}
              </button>
            );
          })}
        </div>
        {errors.platforms && <p className="mt-1 text-xs text-red-600">{errors.platforms}</p>}
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-xs text-muted">
          {mode === "demo"
            ? "Demo mode — instant sample output, no API key needed."
            : "Live mode — generated by Claude on the server (≈30–90s)."}
        </p>
        <Button type="submit" variant="primary" size="lg" disabled={loading}>
          {loading ? <Spinner /> : <Icons.Sparkle />}
          {loading ? "Directing…" : "Generate campaign"}
        </Button>
      </div>
    </form>
  );
}
