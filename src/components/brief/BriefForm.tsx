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

interface Props {
  value: BriefInput;
  onChange: (brief: BriefInput) => void;
  photos: PhotoItem[];
  onAddPhotos: (files: File[]) => string[];
  onRemovePhoto: (id: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  loading: boolean;
  mode: "demo" | "live";
}

const inputClass = (err?: string) =>
  cx(
    "w-full rounded-lg border bg-char-2 px-3.5 py-3 text-[15px] text-bone placeholder:text-bone/25 transition",
    "focus:border-bone/50 focus:outline-none focus:ring-4 focus:ring-signal/15",
    err ? "border-signal" : "border-bone/10",
  );

function Section({ n, title, intro, children }: { n: string; title: string; intro: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-bone/10 py-10 md:grid-cols-[minmax(0,15rem)_1fr] md:gap-12">
      <div>
        <span className="font-display text-5xl leading-none text-signal md:text-6xl">{n}</span>
        <h3 className="mt-3 font-serif text-3xl italic leading-tight text-bone">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-mute">{intro}</p>
      </div>
      <div className="min-w-0 space-y-6">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  optional,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-bone">
          {label}
        </label>
        {optional && <span className="font-mono text-[10px] uppercase tracking-widest text-mute">Optional</span>}
      </div>
      {hint && <p className="mb-2.5 text-xs text-mute">{hint}</p>}
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-signal">
          {error}
        </p>
      )}
    </div>
  );
}

export function BriefForm({ value, onChange, photos, onAddPhotos, onRemovePhoto, onSubmit, onCancel, loading, mode }: Props) {
  const [errors, setErrors] = useState<Errors>({});

  function set<K extends FieldKey>(key: K, v: BriefInput[K]) {
    onChange({ ...value, [key]: v });
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function togglePlatform(p: Platform) {
    const current = value.platforms ?? [];
    set(
      "platforms",
      current.includes(p) ? current.filter((x) => x !== p) : PLATFORMS.filter((x) => x === p || current.includes(x)),
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = BriefSchema.safeParse(value);
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const k = issue.path[0] as FieldKey;
        next[k] ??= issue.message;
      }
      setErrors(next);
      const first = Object.keys(next)[0];
      requestAnimationFrame(() => document.getElementById(`brief-${first}`)?.focus());
      return;
    }
    setErrors({});
    onSubmit();
  }

  const errorCount = Object.values(errors).filter(Boolean).length;
  const text = (key: "brandName" | "brandDescription" | "productDescription" | "goal" | "audience") => ({
    id: `brief-${key}`,
    name: key,
    value: value[key] ?? "",
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `brief-${key}-error` : undefined,
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
    className: inputClass(errors[key]),
  });

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Campaign brief">
      <Section n="01" title="The brand" intro="Who you are and what you stand for, in your own words.">
        <Field id="brief-brandName" label="Brand name" error={errors.brandName}>
          <input type="text" autoComplete="organization" placeholder="e.g. Atelier Noor" {...text("brandName")} />
        </Field>
        <Field
          id="brief-brandDescription"
          label="Brand description"
          hint="Values, materials, attitude. Words like sustainable, handmade, playful or minimal shape the concepts."
          error={errors.brandDescription}
        >
          <textarea
            rows={4}
            placeholder="e.g. A small-batch label making handmade knitwear from recycled wool, with a playful, colourful point of view."
            {...text("brandDescription")}
          />
        </Field>
      </Section>

      <Section n="02" title="The product" intro="What this campaign is selling or launching.">
        <Field id="brief-productDescription" label="Product / collection description" error={errors.productDescription}>
          <textarea
            rows={3}
            placeholder="e.g. The Winter Bloom capsule: six oversized cardigans in hand-dyed merino with embroidered flowers."
            {...text("productDescription")}
          />
        </Field>
        <Field
          id="brief-photos"
          label="Product photos"
          optional
          hint="Up to six images. They appear as visual references throughout your campaign workspace."
        >
          <PhotoUploader photos={photos} onAdd={onAddPhotos} onRemove={onRemovePhoto} />
        </Field>
      </Section>

      <Section
        n="03"
        title="References"
        intro="Links are saved with your project and shown in the workspace for your team. The demo doesn't open or analyse them."
      >
        <LinkListInput
          label="Instagram & TikTok references"
          hint="Your brand profile or posts whose feel you like."
          placeholder="https://instagram.com/yourbrand"
          value={value.socialLinks ?? []}
          onChange={(v) => set("socialLinks", v)}
          allowed={["instagram", "tiktok"]}
          error={errors.socialLinks}
        />
        <LinkListInput
          label="Product website"
          hint="Shop or product pages."
          placeholder="https://yourbrand.com/collection"
          value={value.websiteLinks ?? []}
          onChange={(v) => set("websiteLinks", v)}
          error={errors.websiteLinks}
        />
        <LinkListInput
          label="Reference videos"
          hint="YouTube, Instagram Reels or TikTok videos with the energy you want."
          placeholder="https://www.tiktok.com/@creator/video/…"
          value={value.videoLinks ?? []}
          onChange={(v) => set("videoLinks", v)}
          allowed={["youtube", "instagram", "tiktok"]}
          error={errors.videoLinks}
        />
      </Section>

      <Section n="04" title="The campaign" intro="What success looks like, and where it will run.">
        <Field id="brief-goal" label="Campaign goal" error={errors.goal}>
          <textarea
            rows={2}
            placeholder="e.g. Launch the capsule and drive pre-orders from new customers aged 20–35."
            {...text("goal")}
          />
        </Field>

        <fieldset>
          <legend className="mb-1 flex w-full items-baseline justify-between text-sm font-medium text-bone">
            Platforms
            <span className="font-mono text-[10px] uppercase tracking-widest text-mute">Optional</span>
          </legend>
          <p className="mb-2.5 text-xs text-mute">
            Leave blank for {DEFAULT_PLATFORMS.map((p) => PLATFORM_LABELS[p]).join(" + ")}.
          </p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const active = (value.platforms ?? []).includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={active}
                  onClick={() => togglePlatform(p)}
                  className={cx(
                    "rounded-full px-4 py-2 text-sm transition",
                    active ? "bg-bone text-ink" : "border border-bone/15 text-bone/70 hover:border-bone/50 hover:text-bone",
                  )}
                >
                  {PLATFORM_LABELS[p]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Field id="brief-audience" label="Target audience" optional error={errors.audience}>
          <input type="text" placeholder="e.g. Creative professionals 25–40 who buy fewer, better pieces" {...text("audience")} />
        </Field>

        <fieldset>
          <legend className="mb-1 flex w-full items-baseline justify-between text-sm font-medium text-bone">
            Hero video duration
            <span className="font-mono text-[10px] uppercase tracking-widest text-mute">Optional</span>
          </legend>
          <p className="mb-2.5 text-xs text-mute">Storyboard timing scales to fit. Defaults to {DEFAULT_DURATION}s.</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Video duration">
            {DURATIONS.map((d) => {
              const active = value.durationSec === d;
              return (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => set("durationSec", active ? undefined : d)}
                  className={cx(
                    "h-12 w-16 rounded-lg font-display text-xl transition",
                    active ? "bg-signal text-ink" : "border border-bone/15 text-bone/70 hover:border-bone/50 hover:text-bone",
                  )}
                >
                  {d}s
                </button>
              );
            })}
          </div>
        </fieldset>
      </Section>

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-bone/10 bg-ink/90 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-mute" aria-live="polite">
            {errorCount > 0 ? (
              <span className="flex items-center gap-1.5 text-signal">
                <Icons.Alert className="h-3.5 w-3.5" />
                {errorCount} field{errorCount > 1 ? "s need" : " needs"} attention
              </span>
            ) : mode === "demo" ? (
              "Demo mode: illustrative concepts from your brief text. No API key, nothing leaves your browser except the brief."
            ) : (
              "Live mode: generated by Claude on the server (about 30–90 seconds)."
            )}
          </p>
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Back to campaign
              </Button>
            )}
            <Button type="submit" variant="signal" size="lg" disabled={loading} className="flex-1 sm:flex-none">
              {loading ? <Spinner /> : <Icons.Sparkle />}
              {loading ? "Creating…" : "Create Campaign"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
