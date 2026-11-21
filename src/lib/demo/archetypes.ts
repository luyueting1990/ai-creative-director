import type { Platform, Swatch } from "../schema";
import type { BriefAnalysis, Category, Signal } from "./analyze";

/**
 * Concept formats for demo mode. Each one is a different way of filming the
 * product, not an invented story: copy only refers to the brand, the product
 * phrase the user typed, and generic production direction.
 */

type A = BriefAnalysis;

export interface ShotTemplate {
  title: string;
  description: (a: A) => string;
  product: boolean;
  weight: number;
  camera: string;
  setting: string;
  direction: string;
  onScreenText?: (a: A) => string;
}

export interface Archetype {
  key: string;
  title: string;
  /** Signals/categories that make this format a better fit. */
  affinity: Partial<Record<Signal | Category, number>>;
  /** If set, the format is only offered when the brief mentions one of these signals. */
  requires?: Signal[];
  idea: (a: A) => string;
  rationale: (a: A) => string;
  look: { setting: string; lighting: string; styling: string };
  palette: Swatch[];
  music: string;
  /** Six shots in order. The first and last are always kept. */
  shots: ShotTemplate[];
  hooks: Record<"tiktok" | "instagram", ((a: A) => string)[]>;
  caption: (a: A, p: Platform) => string;
  hashtag: string;
}

const endCard = (line: (a: A) => string): ShotTemplate => ({
  title: "End card",
  description: (a) => `Logo and closing line: ${line(a)}`,
  product: false,
  weight: 0.7,
  camera: "Graphic",
  setting: "Post-production",
  direction: "Keep the type small and centred. Hold for at least 2 seconds.",
  onScreenText: line,
});

export const ARCHETYPES: Archetype[] = [
  {
    key: "portrait",
    title: "Product Portrait",
    affinity: { luxury: 3, minimal: 3, jewelry: 2, bags: 2, tailoring: 2, eveningwear: 1 },
    idea: (a) => `A clean studio film that puts ${a.product} centre stage, from full look to close detail.`,
    rationale: () => "Simple to produce and lets the product speak for itself, so it works for any audience.",
    look: {
      setting: "Studio with a plain, seamless backdrop",
      lighting: "Soft, even key light with gentle shadow",
      styling: "Minimal styling so the product leads",
    },
    palette: [
      { name: "Paper", hex: "#EEEAE3" },
      { name: "Stone", hex: "#B8B1A6" },
      { name: "Graphite", hex: "#3A3A3C" },
      { name: "Ink", hex: "#151517" },
    ],
    music: "Minimal piano or ambient track, slow tempo",
    shots: [
      { title: "Full look", description: (a) => `Model wearing ${a.product}, standing still, then a slow turn.`, product: true, weight: 1.3, camera: "50mm, locked off", setting: "Studio", direction: "Start completely still for one second before the turn." },
      { title: "Detail", description: (a) => `Close-up of the most distinctive detail of ${a.product}.`, product: true, weight: 1, camera: "100mm macro, slow slide", setting: "Studio", direction: "Pick one detail only and move across it slowly." },
      { title: "Walk", description: () => "Model walks toward camera; the piece moves with them.", product: true, weight: 1.2, camera: "85mm, static", setting: "Studio", direction: "Walk at a relaxed pace, eyes just past the lens." },
      { title: "Second look", description: () => "A second piece or styling from the collection, same framing.", product: true, weight: 1.1, camera: "50mm, locked off", setting: "Studio", direction: "Match the framing of the first look for a clean cut." },
      { title: "Close portrait", description: () => "Head-and-shoulders portrait with the product in frame.", product: true, weight: 1, camera: "85mm", setting: "Studio", direction: "Natural expression; hold for a beat." },
      endCard((a) => a.brand),
    ],
    hooks: {
      tiktok: [(a) => `Everything you need to know about ${a.product} in ${a.durationSec} seconds.`, () => "Watch for the detail at the end."],
      instagram: [(a) => `${a.brand}, up close.`, (a) => `Introducing ${a.product}.`],
    },
    caption: (a) => `Introducing ${a.product} from ${a.brand}.`,
    hashtag: "#ProductFilm",
  },
  {
    key: "everyday",
    title: "In Real Life",
    affinity: { community: 3, playful: 1, denim: 2, streetwear: 2, knitwear: 2, resort: 2, outerwear: 1 },
    idea: (a) => `${a.product} worn by real people in the places they actually go.`,
    rationale: (a) =>
      a.audienceProvided
        ? `Shows ${a.audience.replace(/\.$/, "")} how the product fits into their day.`
        : "Relatable and native to social feeds, where real-life content performs well.",
    look: {
      setting: "Home, street and café locations",
      lighting: "Natural daylight",
      styling: "Styled the way your customers would wear it",
    },
    palette: [
      { name: "Daylight", hex: "#F2EDE4" },
      { name: "Sand", hex: "#CDB79A" },
      { name: "Olive", hex: "#6E7350" },
      { name: "Denim", hex: "#3E5470" },
    ],
    music: "Upbeat, warm indie track",
    shots: [
      { title: "Getting ready", description: (a) => `At home, putting on ${a.product}.`, product: true, weight: 1, camera: "35mm, handheld", setting: "Home, by a window", direction: "Keep it unposed — real movements, not poses." },
      { title: "Out the door", description: () => "Walking down the street in natural light.", product: true, weight: 1.2, camera: "50mm, gimbal follow", setting: "Street", direction: "Film from behind, then let them turn into frame." },
      { title: "Detail in daylight", description: (a) => `Quick close-up of ${a.product} in daylight.`, product: true, weight: 0.9, camera: "85mm", setting: "Street", direction: "Two seconds is enough — keep it moving." },
      { title: "With friends", description: () => "A casual moment with friends; the product is visible but not posed.", product: true, weight: 1.3, camera: "35mm, handheld", setting: "Café or park", direction: "Let a real conversation run and catch the natural moments." },
      { title: "Later", description: () => "The same look later in the day, in a different setting.", product: true, weight: 1, camera: "35mm", setting: "Evening street", direction: "Shows the piece works from day to night." },
      endCard((a) => `${a.brand}. Made to be worn.`),
    ],
    hooks: {
      tiktok: [(a) => `A day in ${a.brand}, start to finish.`, () => "How I actually wear it, morning to night."],
      instagram: [() => "Made to be worn, not just photographed.", (a) => `${a.product}, out in the world.`],
    },
    caption: (a, p) => (p === "tiktok" ? `A real day in ${a.product}. ${ctaFor(a)}` : `${a.product}, worn every day. ${ctaFor(a)}`),
    hashtag: "#OOTD",
  },
  {
    key: "closeup",
    title: "Close Up",
    affinity: { luxury: 2, minimal: 2, craft: 2, jewelry: 3, bags: 2, knitwear: 2, footwear: 1 },
    idea: (a) => `A slow, close-up film that shows the texture and finish of ${a.product}.`,
    rationale: () => "Close-up, tactile footage stops the scroll and shows quality without needing words.",
    look: {
      setting: "Tabletop or studio, one simple surface",
      lighting: "Low, raking light to bring out texture",
      styling: "Product and skin only",
    },
    palette: [
      { name: "Bone", hex: "#F4EFE7" },
      { name: "Clay", hex: "#C58B6A" },
      { name: "Umber", hex: "#5A4335" },
      { name: "Onyx", hex: "#151517" },
    ],
    music: "Close-mic'd sound (fabric, clasp, touch) under a soft drone",
    shots: [
      { title: "Surface", description: (a) => `Extreme close-up of ${a.product}, so close it's abstract at first.`, product: true, weight: 1, camera: "100mm macro", setting: "Tabletop", direction: "Start too close to recognise; the reveal comes later." },
      { title: "Touch", description: () => "A hand slowly touches the product; the camera follows.", product: true, weight: 1.2, camera: "100mm macro, follow focus", setting: "Tabletop", direction: "Slow the movement right down." },
      { title: "Movement", description: () => "The product moves in slow motion.", product: true, weight: 1.1, camera: "85mm, 120fps", setting: "Studio", direction: "A simple turn or a fan creates enough movement." },
      { title: "Detail", description: () => "Close-up of a finishing detail.", product: true, weight: 1, camera: "100mm macro, slow slide", setting: "Tabletop", direction: "One detail, one slow move." },
      { title: "Reveal", description: (a) => `First wide shot: ${a.product} in full.`, product: true, weight: 1.2, camera: "50mm, slow pull back", setting: "Studio", direction: "The only wide shot — make it feel like a release." },
      endCard((a) => `${a.brand}. Look closer.`),
    ],
    hooks: {
      tiktok: [() => "Turn the sound on for this one.", (a) => `Guess what this is before it zooms out. (It's ${a.brand}.)`],
      instagram: [() => "Closer. Closer. There.", (a) => `${a.product}, up close.`],
    },
    caption: (a) => `${a.product}, up close. Sound on. ${ctaFor(a)}`,
    hashtag: "#Details",
  },
  {
    key: "process",
    title: "How It's Made",
    affinity: { craft: 4, sustainable: 3, heritage: 3 },
    requires: ["craft", "sustainable", "heritage"],
    idea: (a) => `Show the people and process behind ${a.product}, filmed in your own workspace.`,
    rationale: (a) =>
      `Your brief mentions ${a.matchedWords.slice(0, 2).map((w) => `“${w}”`).join(" and ") || "how the product is made"}; showing the process backs that up.`,
    look: {
      setting: "Your studio or workshop",
      lighting: "Available light, plus one soft light for faces",
      styling: "Your team in their usual work clothes",
    },
    palette: [
      { name: "Chalk", hex: "#F1EEE8" },
      { name: "Tan", hex: "#B98B5E" },
      { name: "Forest", hex: "#2F4A3A" },
      { name: "Soot", hex: "#1E1E1C" },
    ],
    music: "Workshop sounds layered into a gentle rhythm",
    shots: [
      { title: "Materials", description: () => "Close-up of the materials you use, being handled.", product: false, weight: 1, camera: "100mm macro", setting: "Workspace", direction: "Film the materials exactly as they're really handled." },
      { title: "The maker", description: () => "A member of your team at work, filmed from the side.", product: false, weight: 1.2, camera: "35mm", setting: "Workspace", direction: "Only film real steps of your process." },
      { title: "Hands at work", description: () => "Quick sequence of hands making or finishing a piece.", product: false, weight: 1.3, camera: "50mm, handheld", setting: "Workbench", direction: "Several short clips cut to the rhythm of the work." },
      { title: "Finished piece", description: (a) => `${a.product}, finished, on the workbench.`, product: true, weight: 1, camera: "50mm", setting: "Workbench", direction: "Hold on the finished piece." },
      { title: "Worn", description: (a) => `Someone wearing ${a.product} steps out into daylight.`, product: true, weight: 1.1, camera: "50mm, push in", setting: "Doorway", direction: "The hand-off moment from maker to wearer." },
      endCard((a) => `${a.brand}. See how it's made.`),
    ],
    hooks: {
      tiktok: [(a) => `This is how a ${a.brand} piece is made.`, () => "Watch until the end to see it finished."],
      instagram: [() => "Who made your clothes? Meet our team.", (a) => `Behind ${a.product}.`],
    },
    caption: (a) => `Behind ${a.product}: the people and process at ${a.brand}. ${ctaFor(a)}`,
    hashtag: "#BehindTheScenes",
  },
  {
    key: "night",
    title: "After Dark",
    affinity: { bold: 3, streetwear: 3, playful: 2, community: 2, eveningwear: 2, footwear: 1 },
    idea: (a) => `${a.product} styled for a night out, cut fast to music.`,
    rationale: () => "Fast, high-energy content suits short-form video and makes a strong, shareable statement.",
    look: {
      setting: "City streets and a rooftop at night",
      lighting: "Neon, street light and on-camera flash",
      styling: "Confident evening styling",
    },
    palette: [
      { name: "Midnight", hex: "#0E1424" },
      { name: "Sodium", hex: "#F2A541" },
      { name: "Signal", hex: "#E5462F" },
      { name: "Chrome", hex: "#C9CED6" },
    ],
    music: "Driving electronic track, around 120 BPM",
    shots: [
      { title: "Getting ready", description: () => "Mirror shot, final touches before going out.", product: true, weight: 1, camera: "35mm, flash", setting: "Home", direction: "Use flash for a punchy, editorial look." },
      { title: "Arrival", description: (a) => `Walking into the night in ${a.product}.`, product: true, weight: 1.1, camera: "24mm, gimbal", setting: "Street at night", direction: "Cut exactly on the beat." },
      { title: "Crew", description: () => "Friends together, quick cuts between faces.", product: true, weight: 1.2, camera: "32mm, handheld", setting: "Rooftop", direction: "Keep everyone moving." },
      { title: "Flash portrait", description: () => "Flash-lit portrait, a freeze frame.", product: true, weight: 0.8, camera: "50mm + flash", setting: "Street", direction: "Grab stills here for carousel posts." },
      { title: "Detail under light", description: (a) => `Close-up of ${a.product} under neon light.`, product: true, weight: 0.9, camera: "85mm", setting: "Neon sign", direction: "Let the coloured light play on the product." },
      endCard((a) => `${a.brand} after dark.`),
    ],
    hooks: {
      tiktok: [() => "Fit check before we go out.", (a) => `Rating ${a.brand} looks from 10pm to 2am.`],
      instagram: [(a) => `${a.brand} after dark.`, () => "Dressed for the night."],
    },
    caption: (a) => `${a.product}, after dark. ${ctaFor(a)}`,
    hashtag: "#NightOut",
  },
  {
    key: "motion",
    title: "In Motion",
    affinity: { performance: 4, activewear: 4, footwear: 3, outerwear: 1, community: 1 },
    idea: (a) => `Show ${a.product} in action — running, stretching and jumping.`,
    rationale: () => "Seeing the product move is the most convincing proof that it performs.",
    look: {
      setting: "Outdoor track, stairs or an empty studio",
      lighting: "Hard daylight with strong shadows",
      styling: "Performance-ready",
    },
    palette: [
      { name: "Concrete", hex: "#BDBAB3" },
      { name: "Court Blue", hex: "#2253C9" },
      { name: "Track Red", hex: "#D63A2F" },
      { name: "Black", hex: "#0D0D0D" },
    ],
    music: "Percussive track built from breath and footsteps",
    shots: [
      { title: "Still", description: () => "Athlete standing still, ready to move.", product: true, weight: 0.9, camera: "35mm, locked off", setting: "Studio", direction: "Hold one second of stillness." },
      { title: "Start", description: () => "First explosive movement, slowing into slow motion.", product: true, weight: 1, camera: "24mm, 120fps", setting: "Studio", direction: "Slow down at the peak of the move." },
      { title: "Product in action", description: (a) => `Close-up of ${a.product} while moving.`, product: true, weight: 1, camera: "85mm, 120fps", setting: "Studio", direction: "Show how it stretches and moves." },
      { title: "Outdoors", description: () => "Running up outdoor stairs, low angle.", product: true, weight: 1.2, camera: "24mm, gimbal", setting: "Outdoor stairs", direction: "Midday sun gives the strongest shadows." },
      { title: "Landing", description: () => "A clean landing, then push in on the product.", product: true, weight: 1, camera: "50mm, push in", setting: "Studio", direction: "Land, pause, then move in fast." },
      endCard((a) => `${a.brand}. Built to move.`),
    ],
    hooks: {
      tiktok: [(a) => `We put ${a.brand} through a real workout.`, () => "Slow it down and watch how it moves."],
      instagram: [() => "Built to move.", (a) => `${a.product}, in motion.`],
    },
    caption: (a) => `${a.product}, in motion. ${ctaFor(a)}`,
    hashtag: "#InMotion",
  },
  {
    key: "unexpected",
    title: "Out of Place",
    affinity: { playful: 4, bold: 2, streetwear: 1, swimwear: 1 },
    idea: (a) => `Wear ${a.product} somewhere unexpected, like a laundromat or supermarket, and play it completely straight.`,
    rationale: () => "Surprising contrast is fun to watch and easy to turn into a repeatable series.",
    look: {
      setting: "Everyday places: laundromat, supermarket, car park",
      lighting: "Flat, bright light",
      styling: "Full looks, styled as if for a runway",
    },
    palette: [
      { name: "Pool", hex: "#5EC8D8" },
      { name: "Pink", hex: "#F7A8C4" },
      { name: "Mustard", hex: "#E9B526" },
      { name: "Cream", hex: "#F6F0E1" },
    ],
    music: "A classical piece played completely straight",
    shots: [
      { title: "The place", description: () => "Symmetrical wide shot of an ordinary laundromat.", product: false, weight: 0.9, camera: "24mm, centred", setting: "Laundromat", direction: "Centre everything in frame." },
      { title: "The walk", description: (a) => `Model walks a runway between the machines in ${a.product}.`, product: true, weight: 1.2, camera: "50mm, static", setting: "Laundromat", direction: "Total commitment — no winking at the camera." },
      { title: "No reaction", description: () => "Someone folding laundry doesn't look up.", product: false, weight: 0.8, camera: "50mm", setting: "Laundromat", direction: "Hold a beat longer than feels comfortable." },
      { title: "Second place", description: () => "The same walk down a supermarket aisle.", product: true, weight: 1.1, camera: "24mm, centred", setting: "Supermarket", direction: "Match the first framing for a clean cut." },
      { title: "The pose", description: () => "End-of-runway pose, freeze frame.", product: true, weight: 0.9, camera: "50mm", setting: "Supermarket", direction: "This frame doubles as the thumbnail." },
      endCard((a) => `${a.brand}. Wear it anywhere.`),
    ],
    hooks: {
      tiktok: [() => "Walking a runway where I really shouldn't.", () => "Part 1: best outfit, most ordinary place."],
      instagram: [() => "Dress code: anything goes.", (a) => `${a.brand}, worn anywhere.`],
    },
    caption: (a, p) => (p === "tiktok" ? `Laundromat runway, part 1. Where next? ${ctaFor(a)}` : `${a.product}, worn anywhere. ${ctaFor(a)}`),
    hashtag: "#WearItAnywhere",
  },
];

export function ctaFor(a: A): string {
  return {
    launch: `Discover ${a.brand}.`,
    conversion: "Shop now.",
    community: `Tag us @${a.brand.toLowerCase().replace(/[^a-z0-9]/g, "")}.`,
    awareness: `Follow ${a.brand}.`,
    repositioning: `Meet the new ${a.brand}.`,
  }[a.goalType];
}

/** Scores formats against the analysis and returns three distinct picks. */
export function pickArchetypes(a: A, pool: Archetype[] = ARCHETYPES): Archetype[] {
  const eligible = pool.filter((arch) => !arch.requires || arch.requires.some((s) => a.signals.includes(s)));
  const scored = eligible.map((arch, i) => {
    const signalScore = a.signals.reduce((sum, s) => sum + (arch.affinity[s] ?? 0), 0);
    const categoryScore = arch.affinity[a.category] ?? 0;
    const jitter = ((a.seed >>> (i * 3)) & 7) / 10; // deterministic tie-breaker per brand
    return { arch, score: signalScore + categoryScore + jitter };
  });
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, 3).map((s) => s.arch);
}

/** 4–6 shots depending on the film length. */
export function shotCountFor(durationSec: number): number {
  if (durationSec <= 15) return 4;
  if (durationSec <= 30) return 5;
  return 6;
}

/** Keeps the first and last shots and evenly samples the middle. */
export function selectShots<T>(shots: T[], count: number): T[] {
  if (shots.length <= count) return shots;
  const middle = shots.slice(1, -1);
  const need = count - 2;
  const picked: T[] = [];
  for (let i = 0; i < need; i++) picked.push(middle[Math.round((i * (middle.length - 1)) / Math.max(1, need - 1))]);
  return [shots[0], ...Array.from(new Set(picked)), shots[shots.length - 1]];
}

/** Splits a total duration across shots by weight, in 0.5s steps, summing exactly. */
export function distributeDuration(weights: number[], total: number): number[] {
  const sum = weights.reduce((s, w) => s + w, 0) || 1;
  const raw = weights.map((w) => Math.max(1, Math.round((w / sum) * total * 2) / 2));
  const diff = Math.round((total - raw.reduce((s, n) => s + n, 0)) * 2) / 2;
  const longest = raw.indexOf(Math.max(...raw));
  raw[longest] = Math.max(1, raw[longest] + diff);
  return raw;
}
