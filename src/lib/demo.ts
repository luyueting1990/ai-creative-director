import { createId } from "./id";
import {
  type Brief,
  type Campaign,
  type Caption,
  type Concept,
  type Frame,
  type Platform,
  type Shot,
  type Swatch,
} from "./schema";

/**
 * Demo-mode generator.
 *
 * Produces three complete, brief-aware campaign concepts without any network
 * call, so the product can be evaluated without an API key. Output is
 * deterministic for a given brief (only ids vary), which also makes it a
 * stable fixture for tests.
 */

type IdFactory = (prefix: string) => string;

interface Archetype {
  title: (b: Ctx) => string;
  tagline: (b: Ctx) => string;
  bigIdea: (b: Ctx) => string;
  visualDirection: (b: Ctx) => string;
  palette: Swatch[];
  soundtrack: string;
  frames: (b: Ctx) => Omit<Frame, "id">[];
  shots: (b: Ctx) => Omit<Shot, "id">[];
  captions: (b: Ctx, p: Platform) => Omit<Caption, "id" | "platform">;
}

interface Ctx {
  brand: string;
  collection: string;
  audience: string;
  goal: string;
  tone: string;
  tag: string;
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

function lowerFirst(s: string): string {
  return s ? s[0].toLowerCase() + s.slice(1) : s;
}

function platformVoice(p: Platform): string {
  switch (p) {
    case "tiktok":
      return "POV:";
    case "x":
      return "";
    case "linkedin":
      return "Behind the campaign:";
    case "pinterest":
      return "Save for later —";
    case "youtube":
      return "Watch the film:";
    default:
      return "";
  }
}

const ARCHETYPES: Archetype[] = [
  {
    title: () => "The Hours Between",
    tagline: (c) => `${c.brand}. Made for the moments no one photographs.`,
    bigIdea: (c) =>
      `A slow, observational film that follows ${c.collection} through one unhurried day — dawn to dusk — celebrating the in-between moments that matter to ${lowerFirst(c.audience)}. Instead of a hero shot, the clothing is the constant thread through real, quiet life. It answers the goal (${lowerFirst(c.goal)}) by building desire through atmosphere rather than spectacle.`,
    visualDirection: (c) =>
      `Natural light only, long lenses, shallow depth of field. Texture-first framing: fabric moving in wind, hands, skin, horizon lines. Tone stays ${lowerFirst(c.tone)}. Grade warm with lifted blacks and soft halation.`,
    palette: [
      { name: "Sun Bleach", hex: "#F3EBDD" },
      { name: "Dune", hex: "#D9C3A5" },
      { name: "Driftwood", hex: "#8C7B6B" },
      { name: "Sea Glass", hex: "#A9C2BC" },
      { name: "Ink", hex: "#1F1D1B" },
    ],
    soundtrack: "Sparse felt piano with field recordings — waves, wind, distant birds. No vocals.",
    frames: (c) => [
      {
        title: "First Light",
        visual: `Extreme close-up: dawn light crosses a folded ${c.collection} piece on a linen-draped chair.`,
        audio: "Room tone, a single piano note.",
        onScreenText: "",
        durationSec: 3,
      },
      {
        title: "Getting Dressed",
        visual: "Silhouette pulls the garment on by an open window; curtains breathe with the wind.",
        audio: "Fabric rustle, soft piano motif begins.",
        onScreenText: "6:12 AM",
        durationSec: 4,
      },
      {
        title: "The Walk",
        visual: "Wide, long-lens tracking shot along an empty coastal road. Garment catches the breeze.",
        audio: "Piano builds; footsteps on gravel.",
        onScreenText: "",
        durationSec: 5,
      },
      {
        title: "Detail Moment",
        visual: "Macro: stitching, weave and label detail under raking afternoon light.",
        audio: "Music drops to near-silence.",
        onScreenText: "Made to be lived in.",
        durationSec: 3,
      },
      {
        title: "Golden Hour",
        visual: "Friends share a table outdoors at sunset; laughter, unposed. Camera drifts past.",
        audio: "Ambient chatter under the full piano theme.",
        onScreenText: "",
        durationSec: 5,
      },
      {
        title: "End Card",
        visual: `Logo lockup over a still horizon at dusk.`,
        audio: "Final chord, waves.",
        onScreenText: `${c.brand} — ${c.collection}`,
        durationSec: 3,
      },
    ],
    shots: (c) => [
      {
        shotType: "ECU / Insert",
        description: `Dawn light across folded ${c.collection} piece`,
        camera: "100mm macro, locked off, 24fps",
        location: "Interior — sunlit bedroom",
        talent: "None (product)",
        durationSec: 3,
      },
      {
        shotType: "Medium / Silhouette",
        description: "Talent dressing by window, curtains moving",
        camera: "50mm, handheld, natural light",
        location: "Interior — bedroom window",
        talent: "Lead talent",
        durationSec: 4,
      },
      {
        shotType: "Wide / Tracking",
        description: "Walk along coastal road, garment in wind",
        camera: "135mm on dolly / car mount, 48fps",
        location: "Exterior — coastal road",
        talent: "Lead talent",
        durationSec: 5,
      },
      {
        shotType: "Macro detail",
        description: "Stitching, weave and label under raking light",
        camera: "100mm macro, slider",
        location: "Exterior — golden hour",
        talent: "Hand model",
        durationSec: 3,
      },
      {
        shotType: "Wide / Drift",
        description: "Sunset dinner table, unposed group moment",
        camera: "35mm, gimbal, slow lateral drift",
        location: "Exterior — garden terrace",
        talent: "Lead + 3 friends",
        durationSec: 5,
      },
    ],
    captions: (c, p) => ({
      text: `${platformVoice(p)} ${p === "tiktok" ? "the slowest morning of your summer, dressed in" : "The hours between are the ones worth dressing for."} ${c.collection} by ${c.brand}.${p === "pinterest" ? " Palette, textures and looks in the board." : ""}`.trim(),
      hashtags: [c.tag, "#SlowFashion", "#QuietLuxury"],
    }),
  },
  {
    title: () => "Afterglow",
    tagline: (c) => `${c.brand} after dark.`,
    bigIdea: (c) =>
      `A high-energy nocturnal campaign that reframes ${c.collection} as the uniform for the city at night. Shot in one continuous night across rooftops, late trains and neon-lit streets, it gives ${lowerFirst(c.audience)} a world to step into — and a reason to share it. Built for short-form first, with loopable moments engineered for remixing.`,
    visualDirection: () =>
      "Cinematic night photography: practical neon, wet streets, anamorphic flares. Fast cuts on the beat, whip pans and match cuts between locations. Talent moves constantly — the clothing is always in motion.",
    palette: [
      { name: "Midnight", hex: "#0E1424" },
      { name: "Sodium", hex: "#F2A541" },
      { name: "Neon Rose", hex: "#E9467A" },
      { name: "Signal Blue", hex: "#3E7BFA" },
      { name: "Chrome", hex: "#C9CED6" },
    ],
    soundtrack: "Driving 124 BPM electronic track with a vocal chop hook — cut-down edits at 6s, 15s and 30s.",
    frames: (c) => [
      {
        title: "Cold Open",
        visual: "Black screen. A match strikes / a phone screen lights a face wearing the collection.",
        audio: "Beat drops on the reveal.",
        onScreenText: "",
        durationSec: 2,
      },
      {
        title: "Rooftop",
        visual: "Crew of friends on a rooftop, city skyline behind, whip pan between faces.",
        audio: "Track kicks in, vocal hook.",
        onScreenText: "TONIGHT",
        durationSec: 3,
      },
      {
        title: "Last Train",
        visual: "Match cut to a moving train carriage; reflections streak across the garments.",
        audio: "Train rumble layered under the beat.",
        onScreenText: "",
        durationSec: 3,
      },
      {
        title: "Street Run",
        visual: "Low-angle tracking as talent runs through a wet, neon-lit street; splashes in slow motion.",
        audio: "Breakdown — music half-time.",
        onScreenText: "",
        durationSec: 4,
      },
      {
        title: "Product Flash",
        visual: `Three rapid product cuts of ${c.collection} under strobe light.`,
        audio: "Three hits on the snare.",
        onScreenText: c.collection,
        durationSec: 2,
      },
      {
        title: "Sunrise Exit",
        visual: "Crew watches sunrise from the rooftop, exhausted and happy. Logo resolves.",
        audio: "Track fades into city ambience.",
        onScreenText: `${c.brand}. After dark.`,
        durationSec: 3,
      },
    ],
    shots: () => [
      {
        shotType: "CU / Practical light",
        description: "Face lit by phone screen or match strike",
        camera: "50mm anamorphic, low ISO, practical only",
        location: "Interior — dark stairwell",
        talent: "Lead talent",
        durationSec: 2,
      },
      {
        shotType: "Medium / Whip pan",
        description: "Crew on rooftop, whip pan between faces",
        camera: "32mm anamorphic, gimbal",
        location: "Exterior — rooftop at night",
        talent: "Lead + 4 crew",
        durationSec: 3,
      },
      {
        shotType: "Medium / Reflection",
        description: "Moving train carriage, light streaks over garments",
        camera: "40mm, handheld, 1/50 shutter for streaks",
        location: "Interior — train carriage",
        talent: "Lead + 2 crew",
        durationSec: 3,
      },
      {
        shotType: "Low angle / Tracking",
        description: "Run through wet neon street, slow-motion splashes",
        camera: "24mm on low-mode gimbal, 120fps",
        location: "Exterior — wet city street",
        talent: "Lead talent",
        durationSec: 4,
      },
      {
        shotType: "Insert / Strobe",
        description: "Product hero cuts under strobe",
        camera: "85mm, locked off, strobe synced",
        location: "Studio — black cyc",
        talent: "None (product)",
        durationSec: 2,
      },
    ],
    captions: (c, p) => ({
      text: `${platformVoice(p)} ${p === "tiktok" ? "you said one drink and now it's sunrise." : "The city doesn't sleep. Neither does"} ${p === "tiktok" ? `Dressed in ${c.collection} from ${c.brand}.` : `${c.collection}. ${c.brand} after dark.`}`.trim(),
      hashtags: [c.tag, "#AfterDark", "#CityNights"],
    }),
  },
  {
    title: () => "Made by Hand",
    tagline: (c) => `Every ${c.brand} piece has a story. Here's ours.`,
    bigIdea: (c) =>
      `A documentary-style campaign that takes ${lowerFirst(c.audience)} behind the seams of ${c.collection}. Real makers, real materials, real voices — each film follows one piece from raw material to finished garment. Transparency becomes the hero, turning craftsmanship into the reason to buy and supporting the goal to ${lowerFirst(c.goal.replace(/^to\s+/i, ""))}.`,
    visualDirection: (c) =>
      `Documentary realism with an editorial edge: 16mm film texture, direct-to-camera interviews, tactile macro inserts of materials and tools. Typography is bold and minimal, used like chapter headings. Voice stays ${lowerFirst(c.tone)}.`,
    palette: [
      { name: "Raw Cotton", hex: "#EFE7DA" },
      { name: "Workshop", hex: "#6E5A47" },
      { name: "Indigo", hex: "#2C3E6B" },
      { name: "Thread Red", hex: "#B23A2E" },
      { name: "Charcoal", hex: "#2A2A2A" },
    ],
    soundtrack: "Workshop sounds (looms, scissors, sewing machines) composed into a rhythmic score, under maker voice-over.",
    frames: (c) => [
      {
        title: "Raw Material",
        visual: "Macro of raw fibre or fabric bolt; a maker's hands enter frame.",
        audio: "Maker VO: \"It starts long before you see it.\"",
        onScreenText: "Chapter 1 — Source",
        durationSec: 4,
      },
      {
        title: "The Maker",
        visual: "Direct-to-camera portrait of the maker in the workshop.",
        audio: "Maker VO introduces themselves and their craft.",
        onScreenText: "",
        durationSec: 5,
      },
      {
        title: "Craft",
        visual: "Rhythmic montage of cutting, stitching, pressing — synced to machine sounds.",
        audio: "Machine rhythm becomes the score.",
        onScreenText: "Chapter 2 — Make",
        durationSec: 6,
      },
      {
        title: "The Piece",
        visual: `Finished ${c.collection} garment revealed on a model in the workshop doorway.`,
        audio: "Score resolves; VO: \"This one's yours now.\"",
        onScreenText: "Chapter 3 — Wear",
        durationSec: 4,
      },
      {
        title: "End Card",
        visual: "Logo with the maker's signature beneath.",
        audio: "Single sewing-machine stop.",
        onScreenText: `${c.brand} — ${c.collection}`,
        durationSec: 3,
      },
    ],
    shots: () => [
      {
        shotType: "Macro / Insert",
        description: "Raw material with maker's hands entering frame",
        camera: "16mm (or emulation), 100mm macro",
        location: "Workshop — material store",
        talent: "Maker",
        durationSec: 4,
      },
      {
        shotType: "Medium / Interview",
        description: "Direct-to-camera portrait and interview",
        camera: "35mm, locked off, Interrotron setup",
        location: "Workshop — main floor",
        talent: "Maker",
        durationSec: 5,
      },
      {
        shotType: "Montage inserts",
        description: "Cutting, stitching, pressing — 12+ quick inserts",
        camera: "50mm & 100mm, handheld, 48fps",
        location: "Workshop — stations",
        talent: "Maker + team",
        durationSec: 6,
      },
      {
        shotType: "Full / Reveal",
        description: "Model in finished piece in workshop doorway",
        camera: "50mm, dolly push-in",
        location: "Workshop — doorway, backlit",
        talent: "Model",
        durationSec: 4,
      },
    ],
    captions: (c, p) => ({
      text: `${platformVoice(p)} ${p === "x" ? `Who made your clothes? For ${c.collection}, we'll introduce you.` : `Meet the hands behind ${c.collection}. Every ${c.brand} piece starts with a person, not a factory line.`}`.trim(),
      hashtags: [c.tag, "#WhoMadeMyClothes", "#Craftsmanship"],
    }),
  },
];

export function generateDemoCampaign(
  brief: Brief,
  idFactory: IdFactory = createId,
  now: Date = new Date(),
): Campaign {
  const ctx: Ctx = {
    brand: brief.brandName,
    collection: brief.collection,
    audience: brief.audience,
    goal: brief.goal,
    tone: brief.tone,
    tag: hashtagify(brief.brandName),
  };

  const concepts: Concept[] = ARCHETYPES.map((a) => ({
    id: idFactory("concept"),
    title: a.title(ctx),
    tagline: a.tagline(ctx),
    bigIdea: a.bigIdea(ctx),
    visualDirection: a.visualDirection(ctx),
    palette: a.palette.map((s) => ({ ...s })),
    soundtrack: a.soundtrack,
    storyboard: a.frames(ctx).map((f) => ({ ...f, id: idFactory("frame") })),
    shotList: a.shots(ctx).map((s) => ({ ...s, id: idFactory("shot") })),
    captions: brief.platforms.map((p) => ({
      ...a.captions(ctx, p),
      platform: p,
      id: idFactory("caption"),
    })),
  }));

  return {
    concepts,
    source: "demo",
    model: "demo-engine",
    generatedAt: now.toISOString(),
  };
}
