import { campaignDuration, campaignPlatforms, type Brief, type Platform } from "../schema";

/**
 * Lightweight, transparent text analysis for demo mode.
 *
 * This is keyword matching over what the user typed, not AI. Matches only
 * steer which concept formats are chosen and how copy is worded; the demo
 * never states facts about the product that the user didn't provide.
 */

export type Category =
  | "denim"
  | "knitwear"
  | "resort"
  | "activewear"
  | "streetwear"
  | "tailoring"
  | "eveningwear"
  | "swimwear"
  | "footwear"
  | "bags"
  | "jewelry"
  | "outerwear"
  | "fashion";

export type Signal =
  | "sustainable"
  | "craft"
  | "luxury"
  | "playful"
  | "minimal"
  | "performance"
  | "heritage"
  | "community"
  | "bold";

export type GoalType = "launch" | "awareness" | "conversion" | "community" | "repositioning";

export const CATEGORIES: Record<Category, { label: string; pattern: RegExp }> = {
  denim: { label: "denim", pattern: /\b(denim|jeans?|indigo|selvedge)\b/ },
  knitwear: { label: "knitwear", pattern: /\b(knit\w*|cashmere|wool|merino|sweaters?|cardigans?)\b/ },
  resort: { label: "resort wear", pattern: /\b(linen|resort|beachwear|vacation)\b/ },
  activewear: { label: "activewear", pattern: /\b(active\w*|athlet\w*|running|runners?|yoga|gym|training|sportswear|leggings?)\b/ },
  streetwear: { label: "streetwear", pattern: /\b(streetwear|hoodies?|graphic tees?|skate\w*)\b/ },
  tailoring: { label: "tailoring", pattern: /\b(tailor\w*|suits?|suiting|blazers?|trousers)\b/ },
  eveningwear: { label: "eveningwear", pattern: /\b(evening|gowns?|bridal|couture|occasion ?wear|party dress\w*)\b/ },
  swimwear: { label: "swimwear", pattern: /\b(swim\w*|bikinis?)\b/ },
  footwear: { label: "footwear", pattern: /\b(shoes?|sneakers?|boots?|footwear|heels|sandals|trainers)\b/ },
  bags: { label: "bags", pattern: /\b(bags?|handbags?|totes?|wallets?|leather goods)\b/ },
  jewelry: { label: "jewellery", pattern: /\b(jewel\w*|rings?|necklaces?|earrings?|bracelets?)\b/ },
  outerwear: { label: "outerwear", pattern: /\b(jackets?|coats?|outerwear|parkas?|puffers?|trench)\b/ },
  fashion: { label: "fashion", pattern: /$^/ },
};

export const SIGNAL_PATTERNS: Record<Signal, RegExp> = {
  sustainable: /\b(sustainab\w*|recycled|organic|deadstock|circular|upcycl\w*|regenerative|ethical\w*|low[- ]impact|traceab\w*)\b/,
  craft: /\b(handmade|hand[- ]made|artisan\w*|atelier|craft\w*|hand[- ](sewn|stitched|woven|dyed|knitted)|small[- ]batch|made to order|workshop)\b/,
  luxury: /\b(luxur\w*|premium|couture|high[- ]end|exclusive|refined|elevated|investment)\b/,
  playful: /\b(playful|fun|colou?rful|cheeky|joy\w*|whims\w*|quirky|irreverent|humou?r)\b/,
  minimal: /\b(minimal\w*|clean|essentials?|timeless|quiet|understated|simple|pared[- ]back)\b/,
  performance: /\b(performance|technical|engineered|functional|weatherproof|breathable)\b/,
  heritage: /\b(heritage|since \d{4}|archive|vintage|tradition\w*|legacy|family[- ]run)\b/,
  community: /\b(community|club|inclusive|together|collective|crew|belong\w*)\b/,
  bold: /\b(bold|loud|daring|provocative|statement|rebel\w*|unapologetic|edgy|electric)\b/,
};

const SIGNAL_TONE: Record<Signal, string> = {
  sustainable: "Honest",
  craft: "Tactile",
  luxury: "Refined",
  playful: "Playful",
  minimal: "Quiet",
  performance: "Energetic",
  heritage: "Grounded",
  community: "Inclusive",
  bold: "Bold",
};

export interface BriefAnalysis {
  brand: string;
  category: Category;
  categoryLabel: string;
  signals: Signal[];
  matchedWords: string[];
  tone: string[];
  goalType: GoalType;
  /** Short phrase taken from the user's product description. */
  product: string;
  audience: string;
  audienceProvided: boolean;
  platforms: Platform[];
  durationSec: number;
  seed: number;
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** First clause of a sentence, trimmed to a readable length. */
export function firstClause(s: string, max = 60): string {
  const clause = s.split(/[.\n;:!?(]|\s[—–-]\s/)[0]?.trim() ?? "";
  const cut = clause.length > max ? clause.slice(0, max).replace(/\s+\S*$/, "") : clause;
  return cut.replace(/[,\s]+$/, "");
}

/** Lower-cases a leading article ("The Winter Bloom capsule" → "the Winter Bloom capsule") but keeps proper nouns. */
export function lowerFirst(s: string): string {
  if (!s) return s;
  if (/^(The|A|An|Our|This|These|Its|Their|My)\b/.test(s)) return s[0].toLowerCase() + s.slice(1);
  if (/^[A-Z][\w'-]*\s+[A-Z]/.test(s) || /^[A-Z]{2}/.test(s)) return s;
  return s[0].toLowerCase() + s.slice(1);
}

export function detectGoal(goal: string): GoalType {
  const g = goal.toLowerCase();
  if (/\b(launch|introduc|debut|drop|release|pre-?order|new collection)\w*/.test(g)) return "launch";
  if (/\b(sales?|sell|convert\w*|revenue|purchase|shop|orders?|traffic)\b/.test(g)) return "conversion";
  if (/\b(community|engag\w*|followers?|ugc|club|loyal\w*|sign[- ]?ups?)\b/.test(g)) return "community";
  if (/\b(reposition\w*|rebrand\w*|perception|reintroduc\w*|younger|refresh)\b/.test(g)) return "repositioning";
  return "awareness";
}

export function analyzeBrief(brief: Brief): BriefAnalysis {
  const corpus = `${brief.brandDescription} ${brief.productDescription}`.toLowerCase();
  const productCorpus = brief.productDescription.toLowerCase();

  const order = Object.keys(CATEGORIES).filter((c) => c !== "fashion") as Category[];
  const category =
    order.find((c) => CATEGORIES[c].pattern.test(productCorpus)) ??
    order.find((c) => CATEGORIES[c].pattern.test(corpus)) ??
    "fashion";

  const matched = new Set<string>();
  const signals = (Object.keys(SIGNAL_PATTERNS) as Signal[]).filter((s) => {
    const m = corpus.match(SIGNAL_PATTERNS[s]);
    if (m) matched.add(m[0]);
    return Boolean(m);
  });

  const tone = signals.map((s) => SIGNAL_TONE[s]);
  for (const fallback of ["Confident", "Modern", "Warm"]) {
    if (tone.length >= 3) break;
    if (!tone.includes(fallback)) tone.push(fallback);
  }

  const audienceProvided = Boolean(brief.audience?.trim());
  const product = lowerFirst(firstClause(brief.productDescription)) || "the collection";

  return {
    brand: brief.brandName.trim(),
    category,
    categoryLabel: CATEGORIES[category].label,
    signals,
    matchedWords: Array.from(matched).slice(0, 6),
    tone: tone.slice(0, 4),
    goalType: detectGoal(brief.goal),
    product,
    audience: audienceProvided ? brief.audience.trim() : "",
    audienceProvided,
    platforms: campaignPlatforms(brief),
    durationSec: campaignDuration(brief),
    seed: hashString(`${brief.brandName}|${brief.productDescription}`.toLowerCase()),
  };
}
