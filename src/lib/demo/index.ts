import { createId } from "../id";
import type { BrandOverview, Brief, Campaign, Concept, Platform } from "../schema";
import { PILLARS, analyzeBrief, type BriefAnalysis, type Signal } from "./analyze";
import { distributeDuration, frameCountFor, pickArchetypes, selectBeats, type Archetype } from "./archetypes";

export { analyzeBrief } from "./analyze";

/**
 * Demo-mode generator.
 *
 * Produces a complete, brief-aware campaign without any network call or API
 * key. Output is deterministic for a given brief (only ids vary). It never
 * claims to have looked at photos, links or videos — those are referenced as
 * inputs for the team to review.
 */

type IdFactory = (prefix: string) => string;

export interface DemoOptions {
  photoCount?: number;
  idFactory?: IdFactory;
  now?: Date;
}

export function hashtagify(s: string): string {
  const cleaned = s
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join("");
  return cleaned ? `#${cleaned}` : "#NewCollection";
}

/** "a" or "an" for the following word. */
export function article(word: string): string {
  return /^[aeiou]/i.test(word) || /^hon/i.test(word) ? "an" : "a";
}

const POSITIONING: [Signal[], (a: BriefAnalysis) => string][] = [
  [["luxury", "sustainable"], (a) => `Own the space where quiet luxury meets radical transparency: ${a.brand} as proof that the best-made thing is also the most responsible.`],
  [["craft", "heritage"], (a) => `Position ${a.brand} as a living archive of craft — made the long way, for people who notice.`],
  [["playful", "community"], (a) => `Make ${a.brand} the brand people wear together: joyful, inclusive and built for sharing.`],
  [["craft", "playful"], (a) => `Pair serious craft with a sense of humour: ${a.brand} is made slowly by hand and worn with a grin.`],
  [["craft", "sustainable"], (a) => `Made the long way, from materials that last: ${a.brand} shows its process as proof of quality.`],
  [["playful"], (a) => `Make joy the differentiator — ${a.brand} as the ${a.categoryLabel} brand that never takes itself too seriously.`],
  [["craft"], (a) => `Put the maker at the centre: ${a.brand} sells the hands and hours behind every piece.`],
  [["performance"], (a) => `Lead with proof: ${a.brand} performs where it matters, and the campaign shows it in motion.`],
  [["bold"], (a) => `Take a clear, provocative stance so ${a.brand} is impossible to scroll past.`],
  [["minimal"], (a) => `Let restraint do the work: ${a.brand} as the essential ${a.categoryLabel} choice for people who edit.`],
  [["sustainable"], (a) => `Make transparency ${a.brand}'s creative engine — show the process, not just the product.`],
  [["luxury"], (a) => `Signal quality through confidence and craft rather than logos: ${a.brand} as a quiet status marker.`],
];

function buildOverview(a: BriefAnalysis, photoCount: number): BrandOverview {
  const positioning =
    POSITIONING.find(([needs]) => needs.every((s) => a.signals.includes(s)))?.[1](a) ??
    `Give ${a.brand} a distinct, ownable point of view in ${a.categoryLabel} — one idea, executed with conviction across every platform.`;

  const pillarSignals: Signal[] = [...a.signals];
  for (const fallback of ["luxury", "community", "bold"] as Signal[]) {
    if (pillarSignals.length >= 3) break;
    if (!pillarSignals.includes(fallback)) pillarSignals.push(fallback);
  }

  const signals: string[] = [];
  if (a.matchedWords.length) signals.push(`Keywords matched in your brief: ${a.matchedWords.map((w) => `“${w}”`).join(", ")}`);
  signals.push(`Category read as ${a.categoryLabel}; goal read as ${a.goalType}`);
  signals.push(`${a.platforms.length} platform${a.platforms.length > 1 ? "s" : ""}, ${a.durationSec}s hero film`);
  if (photoCount) signals.push(`${photoCount} product photo${photoCount > 1 ? "s" : ""} attached as visual references (not analysed)`);
  if (a.linkCount) signals.push(`${a.linkCount} reference link${a.linkCount > 1 ? "s" : ""} saved for the team to review (not analysed)`);

  return {
    summary: `From your description, ${a.brand} reads as ${article(a.tones[0])} ${a.tones
      .slice(0, 2)
      .map((t) => t.toLowerCase())
      .join(", ")} ${a.categoryLabel} brand built around ${a.product}. ${a.essence ? `In your words: “${a.essence}.”` : ""}`.trim(),
    positioning,
    audienceInsight: a.audienceProvided
      ? `You're speaking to ${a.audience.replace(/\.$/, "")}. Content should earn attention in the first second and reward a rewatch.`
      : `No audience given, so we've assumed: ${a.audience.toLowerCase()}. Refine this in the brief to sharpen the concepts.`,
    toneKeywords: a.tones,
    pillars: pillarSignals.slice(0, 3).map((s) => ({ title: PILLARS[s].title, description: PILLARS[s].description(a.brand) })),
    signals,
  };
}

function buildConcept(arch: Archetype, a: BriefAnalysis, index: number, photoCount: number, id: IdFactory): Concept {
  const variant = (a.seed >>> (index + 2)) % arch.titles.length;
  const palette = arch.palettes[(a.seed >>> (index + 5)) % arch.palettes.length];
  const beats = selectBeats(arch.beats, frameCountFor(a.durationSec));
  const durations = distributeDuration(
    beats.map((b) => b.weight),
    a.durationSec,
  );

  const moodboard = arch.moodboard(a);
  if (photoCount) {
    moodboard.references = [
      `Anchor colour and texture choices to your ${photoCount} uploaded product photo${photoCount > 1 ? "s" : ""}`,
      ...moodboard.references,
    ];
  }

  const tags = (p: Platform) =>
    Array.from(
      new Set([hashtagify(a.brand), arch.hashtag, hashtagify(a.categoryLabel), p === "tiktok" ? "#FashionTok" : "#NewCollection"]),
    );

  return {
    id: id("concept"),
    title: arch.titles[variant],
    tagline: arch.tagline(a),
    bigIdea: arch.bigIdea(a),
    whyItWorks: arch.whyItWorks(a),
    visualDirection: arch.visualDirection(a),
    moodboard,
    palette: palette.map((s) => ({ ...s })),
    soundtrack: arch.soundtrack,
    storyboard: beats.map((b, i) => ({
      id: id("frame"),
      title: b.title,
      visual: b.visual(a),
      audio: b.audio,
      onScreenText: b.onScreenText?.(a) ?? "",
      durationSec: durations[i],
      featuresProduct: Boolean(b.featuresProduct),
    })),
    shotList: beats.map((b, i) => ({
      id: id("shot"),
      shotType: b.shot.shotType,
      description: b.visual(a),
      camera: b.shot.camera,
      movement: b.shot.movement,
      lighting: b.shot.lighting,
      location: b.shot.location,
      talent: b.shot.talent,
      direction: b.shot.direction(a),
      durationSec: durations[i],
    })),
    hooks: (["tiktok", "instagram"] as const).flatMap((p) =>
      arch.hooks[p].slice(0, 2).map((h) => ({ id: id("hook"), platform: p, text: h(a) })),
    ),
    captions: a.platforms.map((p) => ({ id: id("caption"), platform: p, text: arch.caption(a, p), hashtags: tags(p) })),
  };
}

export function generateDemoCampaign(brief: Brief, opts: DemoOptions = {}): Campaign {
  const { photoCount = 0, idFactory = createId, now = new Date() } = opts;
  const analysis = analyzeBrief(brief);
  const archetypes = pickArchetypes(analysis);

  return {
    overview: buildOverview(analysis, photoCount),
    concepts: archetypes.map((arch, i) => buildConcept(arch, analysis, i, photoCount, idFactory)),
    source: "demo",
    model: "demo-engine",
    generatedAt: now.toISOString(),
  };
}
