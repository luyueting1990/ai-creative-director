import { createId } from "./id";
import type { GeneratedCampaign } from "./prompt";
import { CampaignSchema, type Brief, type Campaign } from "./schema";

export class InvalidGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidGenerationError";
  }
}

const HEX = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

function normalizeHex(input: string): string | null {
  const m = input.trim().match(HEX);
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  return `#${hex.toUpperCase()}`;
}

function clampDuration(n: number): number {
  if (!Number.isFinite(n)) return 3;
  return Math.min(120, Math.max(0, Math.round(n * 10) / 10));
}

function normalizeTag(tag: string): string {
  const t = tag.trim().replace(/\s+/g, "");
  if (!t) return "";
  return t.startsWith("#") ? t : `#${t}`;
}

/**
 * Turns raw model output into a validated `Campaign`: assigns ids, repairs
 * small formatting issues (hex codes, hashtags, durations), drops captions for
 * platforms that weren't requested and enforces exactly three concepts.
 */
export function normalizeGeneratedCampaign(
  raw: GeneratedCampaign,
  brief: Brief,
  model: string,
  idFactory: (prefix: string) => string = createId,
): Campaign {
  if (raw.concepts.length < 3) {
    throw new InvalidGenerationError(
      `Expected 3 concepts but the model returned ${raw.concepts.length}.`,
    );
  }

  const allowed = new Set(brief.platforms);

  const concepts = raw.concepts.slice(0, 3).map((c) => ({
    id: idFactory("concept"),
    title: c.title.trim(),
    tagline: c.tagline.trim(),
    bigIdea: c.bigIdea.trim(),
    visualDirection: c.visualDirection.trim(),
    soundtrack: c.soundtrack.trim(),
    palette: c.palette.flatMap((s) => {
      const hex = normalizeHex(s.hex);
      return hex ? [{ name: s.name.trim() || hex, hex }] : [];
    }),
    storyboard: c.storyboard.map((f) => ({
      ...f,
      id: idFactory("frame"),
      durationSec: clampDuration(f.durationSec),
    })),
    shotList: c.shotList.map((s) => ({
      ...s,
      id: idFactory("shot"),
      durationSec: clampDuration(s.durationSec),
    })),
    captions: c.captions
      .filter((cap) => allowed.has(cap.platform))
      .map((cap) => ({
        ...cap,
        id: idFactory("caption"),
        hashtags: cap.hashtags.map(normalizeTag).filter(Boolean),
      })),
  }));

  for (const c of concepts) {
    if (c.storyboard.length === 0 || c.shotList.length === 0) {
      throw new InvalidGenerationError(`Concept "${c.title}" is missing a storyboard or shot list.`);
    }
  }

  const result = CampaignSchema.safeParse({
    concepts,
    source: "claude",
    model,
    generatedAt: new Date().toISOString(),
  });
  if (!result.success) {
    throw new InvalidGenerationError(result.error.issues[0]?.message ?? "Invalid campaign");
  }
  return result.data;
}
