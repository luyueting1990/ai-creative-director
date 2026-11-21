import { createId } from "../id";
import type { Brief, BriefRead, Campaign, Concept, Platform } from "../schema";
import { analyzeBrief, type BriefAnalysis } from "./analyze";
import { distributeDuration, pickArchetypes, selectShots, shotCountFor, type Archetype } from "./archetypes";

export { analyzeBrief } from "./analyze";

/**
 * Demo-mode generator: a rule-based engine that builds three concepts from
 * the brief text without any network call or API key. Output is
 * deterministic for a given brief (only ids vary). It never claims to have
 * looked at photos, links or videos.
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

function buildRead(a: BriefAnalysis, photoCount: number, linkCount: number): BriefRead {
  const tone = a.tone.slice(0, 2).map((t) => t.toLowerCase());
  const notes: string[] = [];
  notes.push(
    a.matchedWords.length
      ? `Matched words in your brief: ${a.matchedWords.map((w) => `“${w}”`).join(", ")}.`
      : "No style keywords matched, so general-purpose formats were chosen.",
  );
  notes.push(`Film length ${a.durationSec}s · ${a.platforms.length} platform${a.platforms.length > 1 ? "s" : ""}.`);
  if (photoCount) notes.push(`${photoCount} photo${photoCount > 1 ? "s" : ""} used as visual references (not analysed).`);
  if (linkCount) notes.push(`${linkCount} link${linkCount > 1 ? "s" : ""} saved for reference (not opened).`);

  return {
    summary: `${a.brand}: ${article(tone[0])} ${tone.join(", ")} ${a.categoryLabel} brand. Campaign focus: ${a.product}.`,
    tone: a.tone,
    notes,
  };
}

function buildConcept(arch: Archetype, a: BriefAnalysis, id: IdFactory): Concept {
  const templates = selectShots(arch.shots, shotCountFor(a.durationSec));
  const durations = distributeDuration(
    templates.map((t) => t.weight),
    a.durationSec,
  );
  const tags = (p: Platform) =>
    Array.from(new Set([hashtagify(a.brand), arch.hashtag, hashtagify(a.categoryLabel), p === "tiktok" ? "#FashionTok" : "#NewIn"]));

  return {
    id: id("concept"),
    title: arch.title,
    idea: capitalise(arch.idea(a)),
    rationale: arch.rationale(a),
    look: { ...arch.look },
    palette: arch.palette.map((s) => ({ ...s })),
    music: arch.music,
    shots: templates.map((t, i) => ({
      id: id("shot"),
      title: t.title,
      description: capitalise(t.description(a)),
      durationSec: durations[i],
      showsProduct: t.product,
      onScreenText: t.onScreenText?.(a) ?? "",
      camera: t.camera,
      setting: t.setting,
      direction: t.direction,
    })),
    hooks: (["tiktok", "instagram"] as const).flatMap((p) =>
      arch.hooks[p].map((h) => ({ id: id("hook"), platform: p, text: capitalise(h(a)) })),
    ),
    captions: a.platforms.map((p) => ({ id: id("caption"), platform: p, text: capitalise(arch.caption(a, p)), hashtags: tags(p) })),
  };
}

function capitalise(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function generateDemoCampaign(brief: Brief, opts: DemoOptions = {}): Campaign {
  const { photoCount = 0, idFactory = createId, now = new Date() } = opts;
  const analysis = analyzeBrief(brief);

  return {
    read: buildRead(analysis, photoCount, brief.links.length),
    concepts: pickArchetypes(analysis).map((arch) => buildConcept(arch, analysis, idFactory)),
    source: "demo",
    model: "rule-based demo",
    generatedAt: now.toISOString(),
  };
}
