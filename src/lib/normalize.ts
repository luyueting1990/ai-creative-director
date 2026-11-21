import { createId } from "./id";
import type { GeneratedCampaign } from "./prompt";
import { CampaignSchema, MAX_SHOTS, campaignPlatforms, type Brief, type Campaign } from "./schema";

export class InvalidGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidGenerationError";
  }
}

const HEX = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export function normalizeHex(input: string): string | null {
  const m = input.trim().match(HEX);
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  return `#${hex.toUpperCase()}`;
}

function clampDuration(n: number): number {
  if (!Number.isFinite(n)) return 3;
  return Math.min(60, Math.max(0, Math.round(n * 2) / 2));
}

function normalizeTag(tag: string): string {
  const t = tag.trim().replace(/\s+/g, "");
  if (!t) return "";
  return t.startsWith("#") ? t : `#${t}`;
}

/**
 * Turns raw model output into a validated `Campaign`: assigns ids, repairs
 * small formatting issues and enforces exactly three concepts with shots.
 */
export function normalizeGeneratedCampaign(
  raw: GeneratedCampaign,
  brief: Brief,
  model: string,
  idFactory: (prefix: string) => string = createId,
): Campaign {
  if (raw.concepts.length < 3) {
    throw new InvalidGenerationError(`Expected 3 concepts but the model returned ${raw.concepts.length}.`);
  }
  const allowed = new Set(campaignPlatforms(brief));

  const concepts = raw.concepts.slice(0, 3).map((c) => ({
    id: idFactory("concept"),
    title: c.title.trim(),
    idea: c.idea.trim(),
    rationale: c.rationale.trim(),
    look: c.look,
    music: c.music.trim(),
    palette: c.palette.flatMap((s) => {
      const hex = normalizeHex(s.hex);
      return hex ? [{ name: s.name.trim() || hex, hex }] : [];
    }),
    shots: c.shots.slice(0, MAX_SHOTS).map((s) => ({ ...s, id: idFactory("shot"), durationSec: clampDuration(s.durationSec) })),
    hooks: c.hooks.filter((h) => h.platform === "tiktok" || h.platform === "instagram").map((h) => ({ ...h, id: idFactory("hook") })),
    captions: c.captions
      .filter((cap) => allowed.has(cap.platform))
      .map((cap) => ({ ...cap, id: idFactory("caption"), hashtags: cap.hashtags.map(normalizeTag).filter(Boolean) })),
  }));

  for (const c of concepts) {
    if (c.shots.length === 0) throw new InvalidGenerationError(`Concept "${c.title}" has no shots.`);
  }

  const result = CampaignSchema.safeParse({
    read: { ...raw.read, notes: [] },
    concepts,
    source: "claude",
    model,
    generatedAt: new Date().toISOString(),
  });
  if (!result.success) throw new InvalidGenerationError(result.error.issues[0]?.message ?? "Invalid campaign");
  return result.data;
}
