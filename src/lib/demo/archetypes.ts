import type { Moodboard, Platform, Swatch } from "../schema";
import type { BriefAnalysis, Category, Signal } from "./analyze";

/**
 * Creative "archetypes" — reusable campaign structures that demo mode
 * personalises with the brief. Each archetype is a distinct strategic lane so
 * the three concepts never feel like variations of one idea.
 */

type A = BriefAnalysis;

export interface Beat {
  title: string;
  visual: (a: A) => string;
  audio: string;
  onScreenText?: (a: A) => string;
  featuresProduct?: boolean;
  weight: number;
  shot: {
    shotType: string;
    camera: string;
    movement: string;
    lighting: string;
    location: string;
    talent: string;
    direction: (a: A) => string;
  };
}

export interface Archetype {
  key: string;
  lane: string;
  affinity: Partial<Record<Signal | Category, number>>;
  titles: string[];
  tagline: (a: A) => string;
  bigIdea: (a: A) => string;
  whyItWorks: (a: A) => string;
  visualDirection: (a: A) => string;
  moodboard: (a: A) => Omit<Moodboard, "references"> & { references: string[] };
  palettes: Swatch[][];
  soundtrack: string;
  /** Ordered beats. The first and last are always used; middle beats are sampled to fit the duration. */
  beats: Beat[];
  hooks: Record<"tiktok" | "instagram", ((a: A) => string)[]>;
  caption: (a: A, p: Platform) => string;
  hashtag: string;
}

const goalLine = (a: A): string =>
  ({
    launch: `It turns the launch of ${a.product} into an event people want to be early to.`,
    awareness: `It gives people who've never heard of ${a.brand} one image they'll remember.`,
    conversion: `Every beat ends on the product, so attention converts into clicks.`,
    community: `It's built to be joined — the format invites people to make their own version.`,
    repositioning: `It shows ${a.brand} in a new light without abandoning what makes it recognisable.`,
  })[a.goalType];

export const ARCHETYPES: Archetype[] = [
  {
    key: "hours-between",
    lane: "Emotional · observational",
    affinity: { minimal: 3, luxury: 2, resort: 3, knitwear: 2, sustainable: 1, jewelry: 1 },
    titles: ["The Hours Between", "Slow Light", "Unhurried"],
    tagline: (a) => `${a.brand}. For the moments no one photographs.`,
    bigIdea: (a) =>
      `An observational film that follows ${a.product} through one unhurried day, dawn to dusk. There's no hero shot; the ${a.noun} is the constant thread through real, quiet life, so the audience projects themselves into it.`,
    whyItWorks: (a) => `Atmosphere builds desire without hard selling — right for an audience described as "${a.audience}". ${goalLine(a)}`,
    visualDirection: (a) =>
      `Natural light only, long lenses, shallow depth of field. Texture-first framing: ${a.materials[0]} moving in the wind, hands, skin, horizons. Warm grade with lifted blacks and soft halation.`,
    moodboard: (a) => ({
      keywords: ["Golden hour", "Stillness", a.materials[0], "Negative space", "Breath", "Domestic ritual"],
      lighting: "Low sun and window light. Shoot the first and last hour of daylight; diffuse anything harsh.",
      styling: `Pared-back styling that lets the ${a.noun} lead. One accessory at most; hair and make-up barely there.`,
      locations: "A sunlit bedroom, an empty coastal or countryside road, an outdoor table at dusk.",
      references: ["Sun-bleached 90s editorial still lifes", "Slow cinema: long takes, ambient sound", "Analogue film grain and halation"],
    }),
    palettes: [
      [
        { name: "Sun Bleach", hex: "#F3EBDD" },
        { name: "Dune", hex: "#D9C3A5" },
        { name: "Driftwood", hex: "#8C7B6B" },
        { name: "Sea Glass", hex: "#A9C2BC" },
        { name: "Ink", hex: "#1F1D1B" },
      ],
      [
        { name: "Oat", hex: "#EDE3D1" },
        { name: "Clay", hex: "#C58B6A" },
        { name: "Olive", hex: "#6E7350" },
        { name: "Mist", hex: "#C9CFD1" },
        { name: "Umber", hex: "#3B2F28" },
      ],
    ],
    soundtrack: "Sparse felt piano over field recordings: wind, waves, distant birds. No vocals.",
    beats: [
      { title: "First Light", weight: 1, featuresProduct: true, visual: (a) => `Extreme close-up: dawn light crawls across folded ${a.noun} on a chair.`, audio: "Room tone, a single piano note.", shot: { shotType: "ECU · insert", camera: "100mm macro, 24fps", movement: "Locked off", lighting: "Raking window light", location: "Sunlit bedroom", talent: "Product only", direction: (a) => `Let the light do the reveal — hold until the ${a.materials[0]} texture reads.` } },
      { title: "Getting Ready", weight: 1.2, visual: (a) => `Silhouette pulls on the ${a.noun} by an open window; curtains breathe with the wind.`, audio: "Fabric rustle; piano motif begins.", onScreenText: () => "6:12 AM", shot: { shotType: "Medium · silhouette", camera: "50mm, natural light", movement: "Handheld, gentle breathing", lighting: "Backlit window", location: "Bedroom window", talent: "Lead", direction: () => "Unposed. Ask talent to dress as they would alone — no eye contact with lens." } },
      { title: "The Walk", weight: 1.4, visual: () => "Long-lens tracking shot along an empty road. Clothing catches the breeze.", audio: "Piano builds; footsteps on gravel.", shot: { shotType: "Wide · tracking", camera: "135mm, 48fps", movement: "Car mount or dolly, parallel", lighting: "Morning side light", location: "Empty road", talent: "Lead", direction: () => "Walk at 80% normal pace; let the garment move in frame left to right." } },
      { title: "Detail", weight: 1, featuresProduct: true, visual: (a) => `Macro of stitching, weave and finish of ${a.product}.`, audio: "Music drops to near-silence.", onScreenText: () => "Made to be lived in.", shot: { shotType: "Macro detail", camera: "100mm macro", movement: "Slow slider", lighting: "Raking afternoon light", location: "Exterior, golden hour", talent: "Hand model", direction: (a) => `Find the single detail that says ${a.brand}; one slow move across it.` } },
      { title: "Midday Pause", weight: 1.1, visual: () => "Talent reads under a tree; light flickers through leaves across the fabric.", audio: "Birdsong, page turn.", shot: { shotType: "Medium wide", camera: "85mm", movement: "Static", lighting: "Dappled shade", location: "Garden or park", talent: "Lead", direction: () => "Hold for a full breath. Stillness is the point." } },
      { title: "Golden Hour", weight: 1.4, visual: () => "Friends share a table outdoors at sunset; laughter, unposed. Camera drifts past.", audio: "Ambient chatter under the full piano theme.", shot: { shotType: "Wide · drift", camera: "35mm, gimbal", movement: "Slow lateral drift", lighting: "Golden hour backlight", location: "Outdoor terrace", talent: "Lead + 3 friends", direction: () => "Run it as a real dinner; shoot for 20 minutes and find the moment." } },
      { title: "Last Light", weight: 1, featuresProduct: true, visual: (a) => `The ${a.noun} hangs on a chair as the sun disappears.`, audio: "Waves; music resolves.", shot: { shotType: "Medium · still life", camera: "50mm", movement: "Locked off", lighting: "Blue hour", location: "Bedroom", talent: "Product only", direction: () => "Bookend the opening frame — same angle, the day has passed." } },
      { title: "End Card", weight: 0.8, visual: () => "Logo lockup over a still horizon.", audio: "Final chord.", onScreenText: (a) => `${a.brand} — ${a.product}`, shot: { shotType: "Graphic", camera: "—", movement: "—", lighting: "—", location: "Post-production", talent: "—", direction: () => "Type set small and centred; let the horizon breathe." } },
    ],
    hooks: {
      tiktok: [
        (a) => `POV: the slowest morning of your summer, dressed in ${a.brand}.`,
        () => "This is your sign to do absolutely nothing today.",
        (a) => `I timed it: 14 hours in ${a.product}. Here's how it moved.`,
      ],
      instagram: [
        () => "The hours between are the ones worth dressing for.",
        (a) => `A day in ${a.product}, start to finish.`,
      ],
    },
    caption: (a, p) =>
      p === "tiktok"
        ? `One whole day, zero rush. ${a.product} by ${a.brand}.`
        : p === "linkedin"
          ? `Behind ${a.brand}'s new campaign: why we chose stillness over spectacle.`
          : `The hours between are the ones worth dressing for. ${a.product}, now from ${a.brand}.`,
    hashtag: "#SlowStyle",
  },
  {
    key: "after-dark",
    lane: "Cultural · high-energy",
    affinity: { streetwear: 3, playful: 2, bold: 3, community: 2, footwear: 2, eveningwear: 2, activewear: 1 },
    titles: ["After Dark", "Night Shift", "Lights Out"],
    tagline: (a) => `${a.brand} after dark.`,
    bigIdea: (a) =>
      `A nocturnal, beat-driven campaign that reframes ${a.product} as the uniform for the city at night — rooftops, last trains, neon streets — shot as one continuous night. Short-form first, with loopable moments made for remixing.`,
    whyItWorks: (a) => `Energy and pace match how ${a.platforms.includes("tiktok") ? "TikTok" : "social"} is consumed; the cut-downs give paid media more to test. ${goalLine(a)}`,
    visualDirection: () =>
      "Cinematic night photography: practical neon, wet streets, anamorphic flares. Cuts land on the beat with whip pans and match cuts between locations. Talent never stops moving.",
    moodboard: (a) => ({
      keywords: ["Neon", "Wet asphalt", "Motion blur", "Flash", "Crew", a.materials[1] ?? "Shine"],
      lighting: "Practical neon and sodium street light, punched with on-camera flash for stills.",
      styling: `Layered and lived-in; the ${a.noun} styled with confidence. Everyone looks like they belong to the same crew.`,
      locations: "A rooftop with a skyline, a moving train carriage, a rain-wet street, a 24-hour diner.",
      references: ["Flash-lit party photography", "Music-video edit rhythm", "Long-exposure city light trails"],
    }),
    palettes: [
      [
        { name: "Midnight", hex: "#0E1424" },
        { name: "Sodium", hex: "#F2A541" },
        { name: "Neon Rose", hex: "#E9467A" },
        { name: "Signal Blue", hex: "#3E7BFA" },
        { name: "Chrome", hex: "#C9CED6" },
      ],
      [
        { name: "Tar", hex: "#111111" },
        { name: "Acid", hex: "#D4FF3A" },
        { name: "Ultraviolet", hex: "#6B3CFF" },
        { name: "Hazard", hex: "#FF5A1F" },
        { name: "Smoke", hex: "#9A9A9A" },
      ],
    ],
    soundtrack: "Driving 124 BPM electronic track with a vocal-chop hook; cut-downs at 6s, 15s and 30s.",
    beats: [
      { title: "Cold Open", weight: 0.7, visual: (a) => `Black screen. A phone lights a face wearing ${a.brand}.`, audio: "Beat drops on the reveal.", shot: { shotType: "CU · practical light", camera: "50mm anamorphic", movement: "Static", lighting: "Phone screen only", location: "Dark stairwell", talent: "Lead", direction: () => "Start in total darkness; the reveal must land exactly on the downbeat." } },
      { title: "Rooftop", weight: 1, visual: () => "Crew on a rooftop, skyline behind; whip pan between faces.", audio: "Track kicks in; vocal hook.", onScreenText: () => "TONIGHT", shot: { shotType: "Medium · whip pan", camera: "32mm anamorphic, gimbal", movement: "Whip pans on the beat", lighting: "City glow + one LED tube", location: "Rooftop", talent: "Lead + crew of 4", direction: () => "Choreograph the pans to the hi-hat; rehearse three times before rolling." } },
      { title: "Last Train", weight: 1, visual: (a) => `Match cut to a moving train; light streaks across the ${a.noun}.`, audio: "Train rumble under the beat.", shot: { shotType: "Medium · reflection", camera: "40mm, 1/50 shutter", movement: "Handheld", lighting: "Passing tunnel lights", location: "Train carriage", talent: "Lead + 2", direction: () => "Shoot against the window so the city streaks over the garments." } },
      { title: "Street Run", weight: 1.3, visual: () => "Low-angle tracking as talent runs through a wet neon street; splashes in slow motion.", audio: "Breakdown — music goes half-time.", shot: { shotType: "Low angle · tracking", camera: "24mm, 120fps", movement: "Low-mode gimbal", lighting: "Neon signage", location: "Wet street", talent: "Lead", direction: () => "Wet the street down; find a puddle reflection of the signage." } },
      { title: "Diner", weight: 1, visual: () => "Crew squeezed into a diner booth; flash photos, fries, laughter.", audio: "Crowd noise over beat.", shot: { shotType: "Medium · flash stills", camera: "35mm + on-camera flash", movement: "Handheld", lighting: "Fluorescent + flash", location: "24-hour diner", talent: "Lead + crew", direction: () => "Shoot motion and stills simultaneously; stills become carousel content." } },
      { title: "Product Flash", weight: 0.7, featuresProduct: true, visual: (a) => `Three rapid hero cuts of ${a.product} under strobe.`, audio: "Three snare hits.", onScreenText: (a) => a.product, shot: { shotType: "Insert · strobe", camera: "85mm", movement: "Locked off", lighting: "Synced strobe on black", location: "Studio, black cyc", talent: "Product only", direction: () => "Three angles, one per snare hit. Keep the background pure black." } },
      { title: "Sunrise", weight: 1, visual: () => "Crew watches the sunrise from the rooftop — exhausted, happy.", audio: "Track fades into city ambience.", shot: { shotType: "Wide", camera: "24mm", movement: "Slow push-in", lighting: "Dawn", location: "Rooftop", talent: "Lead + crew", direction: () => "Real sunrise only; book a weather backup day." } },
      { title: "End Card", weight: 0.6, visual: () => "Logo resolves over a flickering neon sign.", audio: "Last bass hit.", onScreenText: (a) => `${a.brand}. After dark.`, shot: { shotType: "Graphic", camera: "—", movement: "—", lighting: "—", location: "Post-production", talent: "—", direction: () => "Animate the logo like a neon tube buzzing on." } },
    ],
    hooks: {
      tiktok: [
        () => "You said one drink. It's now 5:47 AM.",
        (a) => `Rating ${a.brand} fits from 10 PM to sunrise.`,
        () => "Don't skip — the last outfit is the best one.",
      ],
      instagram: [
        () => "The city doesn't sleep. Neither do we.",
        (a) => `${a.brand}, from last train to first light.`,
      ],
    },
    caption: (a, p) =>
      p === "tiktok"
        ? `One night, one crew, one fit. ${a.brand} after dark.`
        : `The city doesn't sleep. Neither does ${a.product}. ${a.brand} after dark.`,
    hashtag: "#AfterDark",
  },
  {
    key: "made-by-hand",
    lane: "Craft · documentary",
    affinity: { craft: 4, sustainable: 3, heritage: 3, leather: 2, denim: 2, jewelry: 2, knitwear: 1 },
    titles: ["Made by Hand", "Behind the Seams", "The Makers"],
    tagline: (a) => `Every ${a.brand} piece has a story. Here's ours.`,
    bigIdea: (a) =>
      `A documentary series that follows ${a.product} from raw material to finished piece. Real makers, real materials, real voices — each film follows one piece through the process, making transparency the reason to buy.`,
    whyItWorks: (a) => `Proof beats claims: showing process builds trust and justifies price. ${goalLine(a)}`,
    visualDirection: () =>
      "Documentary realism with an editorial edge: 16mm grain, direct-to-camera interviews and tactile macro inserts of tools and materials. Bold, minimal chapter typography.",
    moodboard: (a) => ({
      keywords: ["Hands", "Tools", "Process", a.materials[0], "Workshop dust", "Chapters"],
      lighting: "Available workshop light with one soft key for interviews. Keep the practicals in frame.",
      styling: `Makers wear their own work clothes; the finished ${a.noun} is styled simply on a model for the reveal.`,
      locations: "The workshop or studio, the material store, a doorway with natural backlight.",
      references: ["16mm documentary portraiture", "Process photography grids", "Editorial chapter typography"],
    }),
    palettes: [
      [
        { name: "Raw Cotton", hex: "#EFE7DA" },
        { name: "Workshop", hex: "#6E5A47" },
        { name: "Indigo", hex: "#2C3E6B" },
        { name: "Thread Red", hex: "#B23A2E" },
        { name: "Charcoal", hex: "#2A2A2A" },
      ],
      [
        { name: "Chalk", hex: "#F1EEE8" },
        { name: "Tan", hex: "#B98B5E" },
        { name: "Forest", hex: "#2F4A3A" },
        { name: "Rust", hex: "#A4512D" },
        { name: "Soot", hex: "#1E1E1C" },
      ],
    ],
    soundtrack: "Workshop sounds (scissors, machines, tools) composed into a rhythmic score under maker voice-over.",
    beats: [
      { title: "Raw Material", weight: 1, visual: (a) => `Macro of ${a.materials[0]}; a maker's hands enter frame.`, audio: 'Maker VO: "It starts long before you see it."', onScreenText: () => "Chapter 1 — Source", shot: { shotType: "Macro · insert", camera: "100mm macro, 16mm grain", movement: "Static, hands enter", lighting: "Window light", location: "Material store", talent: "Maker", direction: () => "Ask the maker to handle the material exactly as they do daily." } },
      { title: "The Maker", weight: 1.3, visual: () => "Direct-to-camera portrait of the maker in the workshop.", audio: "Maker introduces themselves and their craft.", shot: { shotType: "Medium · interview", camera: "35mm, Interrotron", movement: "Locked off", lighting: "Soft key + practicals", location: "Workshop floor", talent: "Maker", direction: () => "Interview for 20 minutes; pull the single most human line." } },
      { title: "Hands at Work", weight: 1.4, visual: () => "Rhythmic montage of cutting, stitching, finishing — synced to machine sounds.", audio: "Machine rhythm becomes the score.", onScreenText: () => "Chapter 2 — Make", shot: { shotType: "Montage inserts", camera: "50mm + 100mm, 48fps", movement: "Handheld", lighting: "Workshop practicals", location: "Workstations", talent: "Maker + team", direction: () => "Capture 15+ inserts; cut them to the sound, not the music." } },
      { title: "The Detail", weight: 1, featuresProduct: true, visual: (a) => `Close-up of the finishing detail that makes ${a.product} distinct.`, audio: "VO: \"This is the part nobody notices — until they do.\"", shot: { shotType: "ECU", camera: "100mm macro", movement: "Slider", lighting: "Raking light", location: "Workbench", talent: "Maker's hands", direction: (a) => `Find the ${a.brand} signature detail and dwell on it.` } },
      { title: "Quality Check", weight: 0.9, visual: () => "Maker inspects the finished piece against the light.", audio: "Quiet; a single tool set down.", shot: { shotType: "Medium", camera: "50mm", movement: "Static", lighting: "Backlit", location: "Workshop window", talent: "Maker", direction: () => "A real inspection — no acting." } },
      { title: "The Piece", weight: 1.2, featuresProduct: true, visual: (a) => `Finished ${a.noun} revealed on a model in the workshop doorway.`, audio: 'VO: "This one\'s yours now."', onScreenText: () => "Chapter 3 — Wear", shot: { shotType: "Full · reveal", camera: "50mm", movement: "Dolly push-in", lighting: "Backlit doorway", location: "Workshop doorway", talent: "Model", direction: () => "Model walks out of the workshop into daylight — the hand-off moment." } },
      { title: "End Card", weight: 0.7, visual: () => "Logo with the maker's signature beneath.", audio: "A single machine stops.", onScreenText: (a) => `${a.brand} — ${a.product}`, shot: { shotType: "Graphic", camera: "—", movement: "—", lighting: "—", location: "Post-production", talent: "—", direction: () => "Scan the maker's real signature for the end card." } },
    ],
    hooks: {
      tiktok: [
        (a) => `It takes this many hands to make one ${a.brand} piece.`,
        () => "Watch this until the end — the last step is wild.",
        () => "Meet the person who actually made your clothes.",
      ],
      instagram: [
        () => "Who made your clothes? We'll introduce you.",
        (a) => `From raw material to ${a.product}, in three chapters.`,
      ],
    },
    caption: (a, p) =>
      p === "x"
        ? `Who made your clothes? For ${a.product}, we'll introduce you.`
        : `Meet the hands behind ${a.product}. Every ${a.brand} piece starts with a person, not a production line.`,
    hashtag: "#WhoMadeMyClothes",
  },
  {
    key: "second-skin",
    lane: "Product · sensory",
    affinity: { luxury: 3, minimal: 2, jewelry: 3, leather: 3, footwear: 2, swimwear: 2, eveningwear: 2 },
    titles: ["Second Skin", "Close Up", "Touch"],
    tagline: (a) => `${a.brand}. Closer than you think.`,
    bigIdea: (a) =>
      `A sensory product film that never pulls wider than arm's length. ${a.product} is shown through extreme macro, sound design and touch, so you can almost feel it through the screen.`,
    whyItWorks: (a) => `Sensory macro content stops the scroll and makes quality obvious without a word of copy. ${goalLine(a)}`,
    visualDirection: (a) =>
      `Macro lenses, controlled studio light, slow motion. Every surface of ${a.materials.join(", ")} becomes landscape. Seamless backgrounds in one tonal colour per film.`,
    moodboard: (a) => ({
      keywords: ["Macro", "Texture", "ASMR", a.materials[0], "Tonal", "Slow motion"],
      lighting: "Hard single source for texture, with flags and bounce. Light shaped like a sculpture.",
      styling: `Skin and ${a.noun} only. Minimal, tonal make-up; hands and collarbones as the canvas.`,
      locations: "Studio with tonal seamless paper; one surface prop such as stone, water or glass.",
      references: ["Scientific macro photography", "ASMR sound design", "Tonal still-life campaigns"],
    }),
    palettes: [
      [
        { name: "Skin", hex: "#E8C8B0" },
        { name: "Bone", hex: "#F4EFE7" },
        { name: "Mocha", hex: "#7A5541" },
        { name: "Graphite", hex: "#3A3A3C" },
        { name: "Gilt", hex: "#C9A45C" },
      ],
      [
        { name: "Pearl", hex: "#EEEAE4" },
        { name: "Blush", hex: "#E7B7B0" },
        { name: "Garnet", hex: "#7D1F2A" },
        { name: "Steel", hex: "#8C939B" },
        { name: "Onyx", hex: "#151517" },
      ],
    ],
    soundtrack: "Close-mic'd foley (fabric, clasp, skin, breath) under a low, warm synth drone.",
    beats: [
      { title: "Surface", weight: 1, featuresProduct: true, visual: (a) => `Macro landscape of ${a.materials[0]} — unrecognisable at first.`, audio: "Close-mic'd texture sound.", shot: { shotType: "Macro", camera: "Probe lens, 120fps", movement: "Ultra-slow slider", lighting: "Hard raking source", location: "Studio", talent: "Product only", direction: () => "Start so close the audience can't tell what it is yet." } },
      { title: "Touch", weight: 1.2, featuresProduct: true, visual: (a) => `A fingertip traces the ${a.noun}; the camera follows.`, audio: "Fingertip foley, amplified.", shot: { shotType: "ECU", camera: "100mm macro", movement: "Follow focus", lighting: "Soft key, black flags", location: "Studio", talent: "Hand model", direction: () => "Slow the touch to half speed; it should feel like a caress." } },
      { title: "Movement", weight: 1.2, visual: (a) => `The ${a.noun} moves in slow motion against skin.`, audio: "Breath; drone swells.", shot: { shotType: "Detail · slow motion", camera: "85mm, 240fps", movement: "Static", lighting: "Backlight for silhouette", location: "Studio", talent: "Model", direction: () => "Use a fan or a simple turn to create motion." } },
      { title: "Element", weight: 1, featuresProduct: true, visual: (a) => `${a.product} meets an element — water, stone or light through glass.`, audio: "Water drop / stone tap.", shot: { shotType: "Insert", camera: "100mm macro", movement: "Locked off", lighting: "Caustics through glass", location: "Studio table", talent: "Product only", direction: () => "One element per film; keep it elemental, not decorative." } },
      { title: "Reveal", weight: 1.3, featuresProduct: true, visual: (a) => `First wider frame: the full ${a.noun} on the body, still tight at the shoulders.`, audio: "Drone resolves.", onScreenText: (a) => a.product, shot: { shotType: "Medium close-up", camera: "65mm", movement: "Slow pull-back", lighting: "Sculpted key", location: "Studio", talent: "Model", direction: () => "The only time we pull back — make it feel like an exhale." } },
      { title: "Logo", weight: 0.7, visual: () => "Logo embossed into the same texture.", audio: "Final soft tap.", onScreenText: (a) => a.brand, shot: { shotType: "Graphic / CGI", camera: "—", movement: "—", lighting: "—", location: "Post-production", talent: "—", direction: () => "Deboss the logo into the hero material texture." } },
    ],
    hooks: {
      tiktok: [
        () => "Turn your sound ON for this one.",
        (a) => `Guess what this is before it zooms out. (It's ${a.brand}.)`,
        () => "The most satisfying 15 seconds you'll watch today.",
      ],
      instagram: [
        () => "Closer. Closer. There.",
        (a) => `${a.product}, at a scale you've never seen.`,
      ],
    },
    caption: (a) => `Closer than you think. ${a.product} by ${a.brand} — sound on.`,
    hashtag: "#CloseUp",
  },
  {
    key: "dress-code-off",
    lane: "Surreal · performative",
    affinity: { playful: 4, bold: 3, streetwear: 1, eveningwear: 1, swimwear: 1, community: 1 },
    titles: ["Dress Code: Off", "Out of Place", "Wrong Room"],
    tagline: (a) => `${a.brand}. Wear it where you shouldn't.`,
    bigIdea: (a) =>
      `A surreal series that drops ${a.product} into gloriously wrong places — a laundromat runway, a supermarket catwalk, a ballet in a car park. Deadpan, art-directed and instantly shareable.`,
    whyItWorks: (a) => `Absurd contrast is the most reliably shareable format on social, and it creates a recognisable series. ${goalLine(a)}`,
    visualDirection: () =>
      "Symmetrical, centred compositions; saturated colour blocking; deadpan performances. Locked-off frames that let the absurdity play out.",
    moodboard: (a) => ({
      keywords: ["Deadpan", "Symmetry", "Colour block", "Absurd", "Set design", a.categoryLabel],
      lighting: "Flat, bright, even. Make ordinary spaces look like a stage.",
      styling: `Full looks, fully committed — styled as if for a runway, in places that aren't.`,
      locations: "Laundromat, supermarket aisle, car park, municipal swimming pool.",
      references: ["Symmetrical, pastel-heavy film framing", "Surrealist fashion still life", "Deadpan comedy timing"],
    }),
    palettes: [
      [
        { name: "Pool", hex: "#5EC8D8" },
        { name: "Bubblegum", hex: "#F7A8C4" },
        { name: "Mustard", hex: "#E9B526" },
        { name: "Tomato", hex: "#E5462F" },
        { name: "Cream", hex: "#F6F0E1" },
      ],
      [
        { name: "Mint", hex: "#A8E6CF" },
        { name: "Lilac", hex: "#C8B6FF" },
        { name: "Cherry", hex: "#D7263D" },
        { name: "Butter", hex: "#FFE38A" },
        { name: "Navy", hex: "#1B2A49" },
      ],
    ],
    soundtrack: "A baroque string piece played completely straight, with comic sound effects punctuating the cuts.",
    beats: [
      { title: "Establish", weight: 1, visual: () => "Perfectly symmetrical wide of a laundromat. Silence.", audio: "Washing machines hum.", shot: { shotType: "Wide · symmetrical", camera: "24mm, centred", movement: "Locked off", lighting: "Flat, bright", location: "Laundromat", talent: "None", direction: () => "Centre everything; measure the frame." } },
      { title: "The Entrance", weight: 1.2, featuresProduct: true, visual: (a) => `A model walks a full runway between the machines in ${a.product}.`, audio: "Strings begin, dead serious.", shot: { shotType: "Full · runway", camera: "50mm", movement: "Static, model walks to lens", lighting: "Flat, bright", location: "Laundromat aisle", talent: "Model", direction: () => "Walk like it's Paris. Total commitment, zero winking." } },
      { title: "Reaction", weight: 0.8, visual: () => "A customer folding towels doesn't look up.", audio: "Comic beat — towel snap.", shot: { shotType: "Medium · deadpan", camera: "50mm", movement: "Locked off", lighting: "Flat", location: "Laundromat", talent: "Extra", direction: () => "The non-reaction is the joke — hold two beats longer than feels right." } },
      { title: "Second Location", weight: 1.2, visual: (a) => `Hard cut: the same walk down a supermarket aisle in another ${a.brand} look.`, audio: "Strings continue; checkout beep.", shot: { shotType: "Wide · symmetrical", camera: "24mm", movement: "Static", lighting: "Fluorescent", location: "Supermarket aisle", talent: "Model", direction: () => "Same framing as the laundromat for a satisfying match cut." } },
      { title: "The Pose", weight: 0.9, featuresProduct: true, visual: () => "Model hits the end-of-runway pose beside a pyramid of oranges.", audio: "Freeze; single cymbal.", onScreenText: () => "Dress code: off.", shot: { shotType: "Full · pose", camera: "50mm", movement: "Locked off", lighting: "Flat + flash pop", location: "Supermarket", talent: "Model", direction: () => "Freeze-frame for the thumbnail." } },
      { title: "Finale", weight: 1.1, visual: () => "A car-park ballet: three models in sync between parked cars.", audio: "Strings crescendo.", shot: { shotType: "Top shot", camera: "Drone, 24mm", movement: "Slow rise", lighting: "Overcast", location: "Car park", talent: "3 models", direction: () => "Simple choreography; parking lines are the stage markings." } },
      { title: "End Card", weight: 0.6, visual: () => "Logo stamped onto the washing-machine glass.", audio: "Spin-cycle buzz.", onScreenText: (a) => `${a.brand}. Wear it where you shouldn't.`, shot: { shotType: "Graphic", camera: "—", movement: "—", lighting: "—", location: "Post-production", talent: "—", direction: () => "Keep the type deadpan: one weight, one size." } },
    ],
    hooks: {
      tiktok: [
        () => "Walking a runway in places I absolutely should not.",
        (a) => `Nobody in this laundromat knew about ${a.brand}. Until now.`,
        () => "Part 1 of wearing my best fit to the worst places.",
      ],
      instagram: [
        () => "Dress code: off.",
        (a) => `${a.brand}, worn exactly where you shouldn't.`,
      ],
    },
    caption: (a, p) =>
      p === "tiktok"
        ? `Laundromat runway, part 1. ${a.product} by ${a.brand}. Where should we go next?`
        : `Dress code: off. ${a.product} by ${a.brand}, worn exactly where you shouldn't.`,
    hashtag: "#DressCodeOff",
  },
  {
    key: "movement-studies",
    lane: "Kinetic · choreographic",
    affinity: { performance: 4, activewear: 4, community: 2, outerwear: 2, footwear: 2, bold: 1 },
    titles: ["Movement Studies", "In Motion", "Body Language"],
    tagline: (a) => `${a.brand}. Built to move.`,
    bigIdea: (a) =>
      `A choreographed film series where dancers and athletes stress-test ${a.product}. Each film is a study of a single movement — the jump, the turn, the sprint — so the product proves itself through motion.`,
    whyItWorks: (a) => `Demonstration content builds credibility and gives creators a format to copy. ${goalLine(a)}`,
    visualDirection: (a) =>
      `High-contrast, graphic and athletic. Hard light and deep shadows; speed ramps between real time and slow motion. ${a.materials[0]} catches the light at peak motion.`,
    moodboard: (a) => ({
      keywords: ["Choreography", "Speed ramp", "Graphic shadow", "Sweat", "Peak moment", a.materials[0]],
      lighting: "Hard top light and a single strong side light; carve the body with shadow.",
      styling: `Performance-first: the ${a.noun} styled to move, shown from every angle during motion.`,
      locations: "Concrete stadium stairs, an empty sports hall, a rooftop court, a black studio.",
      references: ["Dance-film choreography", "Sports photography at peak action", "Bauhaus-style graphic shadows"],
    }),
    palettes: [
      [
        { name: "Concrete", hex: "#BDBAB3" },
        { name: "Volt", hex: "#C8F03A" },
        { name: "Court Blue", hex: "#2253C9" },
        { name: "Track Red", hex: "#D63A2F" },
        { name: "Black", hex: "#0D0D0D" },
      ],
      [
        { name: "Chalk", hex: "#F2F2EE" },
        { name: "Signal Orange", hex: "#FF6A13" },
        { name: "Cobalt", hex: "#1F3FBF" },
        { name: "Slate", hex: "#55595F" },
        { name: "Jet", hex: "#111215" },
      ],
    ],
    soundtrack: "Percussive score built from body sounds — breath, footfalls, claps — layered into a rhythm.",
    beats: [
      { title: "Stillness", weight: 0.9, visual: () => "Dancer stands motionless in a hard pool of light.", audio: "Single breath.", shot: { shotType: "Wide · graphic", camera: "35mm", movement: "Locked off", lighting: "Hard top light", location: "Black studio", talent: "Dancer", direction: () => "Hold for a full second of stillness before anything happens." } },
      { title: "Ignition", weight: 1, visual: () => "First explosive movement; speed ramps from real time to slow motion.", audio: "Footfall triggers the beat.", shot: { shotType: "Full · speed ramp", camera: "24mm, 240fps", movement: "Static", lighting: "Hard side light", location: "Black studio", talent: "Dancer", direction: () => "Ramp at the apex of the movement, not the start." } },
      { title: "Fabric at Peak", weight: 1, featuresProduct: true, visual: (a) => `Close-up of the ${a.noun} at peak stretch and movement.`, audio: "Fabric whip sound.", shot: { shotType: "Detail", camera: "85mm, 240fps", movement: "Follow", lighting: "Hard side light", location: "Studio", talent: "Dancer", direction: (a) => `Show ${a.materials[0]} performing — stretch, recovery, drape.` } },
      { title: "Stairs", weight: 1.2, visual: () => "Athlete sprints concrete stadium stairs; low angle, graphic shadows.", audio: "Breath and footfalls build.", shot: { shotType: "Low angle", camera: "24mm", movement: "Gimbal follow", lighting: "Midday hard sun", location: "Stadium stairs", talent: "Athlete", direction: () => "Shoot at midday for the hardest shadows." } },
      { title: "Group Sync", weight: 1.2, visual: (a) => `Five performers move in sync, all in ${a.brand}.`, audio: "Claps join the rhythm.", onScreenText: () => "Built to move.", shot: { shotType: "Top shot", camera: "Drone / jib", movement: "Slow rise", lighting: "Even", location: "Rooftop court", talent: "5 performers", direction: () => "Keep the choreography simple so it's easy to copy on TikTok." } },
      { title: "Landing", weight: 1, featuresProduct: true, visual: (a) => `Perfect landing; push in to ${a.product}.`, audio: "Beat stops dead.", shot: { shotType: "Full → close-up", camera: "50mm", movement: "Push-in", lighting: "Hard key", location: "Black studio", talent: "Dancer", direction: () => "Land, freeze, then push in fast." } },
      { title: "End Card", weight: 0.6, visual: () => "Logo cut out of a graphic shadow.", audio: "Final exhale.", onScreenText: (a) => `${a.brand}. Built to move.`, shot: { shotType: "Graphic", camera: "—", movement: "—", lighting: "—", location: "Post-production", talent: "—", direction: () => "Animate the logo with a speed ramp to match the film." } },
    ],
    hooks: {
      tiktok: [
        (a) => `We tried to break ${a.brand}. Here's what happened.`,
        () => "Learn this 8-count in 15 seconds.",
        () => "Slow it down and watch the fabric.",
      ],
      instagram: [
        () => "Built to move. Proven in motion.",
        (a) => `One movement, one study: ${a.product}.`,
      ],
    },
    caption: (a, p) =>
      p === "tiktok"
        ? `Learn the 8-count, tag us, wear ${a.brand}.`
        : `Built to move. ${a.product} by ${a.brand}, proven in motion.`,
    hashtag: "#BuiltToMove",
  },
];

/** Scores archetypes against the analysis and returns three distinct picks. */
export function pickArchetypes(a: A, pool: Archetype[] = ARCHETYPES): Archetype[] {
  const scored = pool.map((arch, i) => {
    const signalScore = a.signals.reduce((sum, s) => sum + (arch.affinity[s] ?? 0), 0);
    const categoryScore = arch.affinity[a.category] ?? 0;
    // Deterministic tie-breaker so different brands get different mixes.
    const jitter = ((a.seed >>> (i * 3)) & 7) / 10;
    return { arch, score: signalScore + categoryScore + jitter };
  });
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, 3).map((s) => s.arch);
}

/** Number of storyboard frames for a target duration. */
export function frameCountFor(durationSec: number): number {
  if (durationSec <= 15) return 4;
  if (durationSec <= 30) return 6;
  if (durationSec <= 45) return 7;
  return 8;
}

/** Keeps the first and last beat and evenly samples the middle. */
export function selectBeats(beats: Beat[], count: number): Beat[] {
  if (beats.length <= count) return beats;
  const middle = beats.slice(1, -1);
  const need = count - 2;
  const picked: Beat[] = [];
  for (let i = 0; i < need; i++) picked.push(middle[Math.round((i * (middle.length - 1)) / Math.max(1, need - 1))]);
  return [beats[0], ...Array.from(new Set(picked)), beats[beats.length - 1]];
}

/** Splits a total duration across beats by weight, rounded to 0.5s, summing exactly. */
export function distributeDuration(weights: number[], total: number): number[] {
  const sum = weights.reduce((s, w) => s + w, 0) || 1;
  const raw = weights.map((w) => Math.max(1, Math.round(((w / sum) * total) * 2) / 2));
  const diff = Math.round((total - raw.reduce((s, n) => s + n, 0)) * 2) / 2;
  const longest = raw.indexOf(Math.max(...raw));
  raw[longest] = Math.max(1, raw[longest] + diff);
  return raw;
}
