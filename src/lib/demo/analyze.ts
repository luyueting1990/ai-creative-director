import { campaignDuration, campaignPlatforms, type Brief, type Platform } from "../schema";

/**
 * Lightweight, transparent text analysis for demo mode.
 *
 * This is keyword matching over what the user typed, not AI. The UI labels its
 * results as "keywords matched in your brief" so nothing is overstated.
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
  | "leather"
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

interface CategoryInfo {
  label: string;
  noun: string;
  materials: string[];
  patterns: RegExp;
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  denim: { label: "denim", noun: "denim", materials: ["raw indigo", "selvedge", "faded washes"], patterns: /\b(denim|jeans?|indigo|selvedge)\b/ },
  knitwear: { label: "knitwear", noun: "knits", materials: ["merino", "chunky cable", "brushed wool"], patterns: /\b(knit\w*|cashmere|wool|merino|sweaters?|cardigans?)\b/ },
  resort: { label: "resort wear", noun: "linen pieces", materials: ["washed linen", "cotton gauze", "sun-bleached cloth"], patterns: /\b(linen|resort|summer|beach|vacation|holiday)\b/ },
  activewear: { label: "activewear", noun: "performance pieces", materials: ["technical mesh", "stretch jersey", "reflective trims"], patterns: /\b(active\w*|athlet\w*|running|runners?|yoga|gym|training|sport\w*|leggings?)\b/ },
  streetwear: { label: "streetwear", noun: "drops", materials: ["heavyweight cotton", "nylon", "screen prints"], patterns: /\b(streetwear|street|hoodies?|graphic tees?|drops?|skate\w*|sneakerheads?)\b/ },
  tailoring: { label: "tailoring", noun: "tailoring", materials: ["wool suiting", "crisp poplin", "sharp lapels"], patterns: /\b(tailor\w*|suits?|suiting|blazers?|trousers|workwear|office)\b/ },
  eveningwear: { label: "eveningwear", noun: "evening pieces", materials: ["silk satin", "sequins", "liquid drapes"], patterns: /\b(evening|gowns?|dresses|bridal|couture|occasion|party)\b/ },
  swimwear: { label: "swimwear", noun: "swimwear", materials: ["recycled lycra", "high-shine stretch", "sun-warmed skin"], patterns: /\b(swim\w*|bikinis?)\b/ },
  footwear: { label: "footwear", noun: "shoes", materials: ["suede", "rubber soles", "polished leather"], patterns: /\b(shoes?|sneakers?|boots?|footwear|heels|sandals|trainers)\b/ },
  leather: { label: "leather goods", noun: "bags", materials: ["vegetable-tanned leather", "brass hardware", "hand stitching"], patterns: /\b(bags?|handbags?|leather|totes?|wallets?|accessor\w*)\b/ },
  jewelry: { label: "jewellery", noun: "jewellery", materials: ["recycled gold", "sterling silver", "light on metal"], patterns: /\b(jewel\w*|rings?|necklaces?|earrings?|bracelets?|gold|silver)\b/ },
  outerwear: { label: "outerwear", noun: "outerwear", materials: ["waxed cotton", "technical shells", "shearling"], patterns: /\b(jackets?|coats?|outerwear|parkas?|puffers?|trench)\b/ },
  fashion: { label: "fashion", noun: "collection", materials: ["texture", "drape", "detail"], patterns: /$^/ },
};

export const SIGNAL_PATTERNS: Record<Signal, RegExp> = {
  sustainable: /\b(sustainab\w*|recycled|organic|deadstock|circular|upcycl\w*|eco|regenerative|ethical\w*|low[- ]impact|traceab\w*|provenance)\b/,
  craft: /\b(handmade|hand[- ]?made|artisan\w*|atelier|crafts?\w*|hand[- ](sewn|stitched|woven|dyed)|small[- ]batch|made to order|workshop)\b/,
  luxury: /\b(luxur\w*|premium|couture|cashmere|silk|high[- ]end|exclusive|refined|elevated|investment)\b/,
  playful: /\b(playful|fun|colou?rful|cheeky|joy\w*|whims\w*|quirky|irreverent|humou?r)\b/,
  minimal: /\b(minimal\w*|clean|essential\w*|timeless|quiet|understated|simple|capsule|pared[- ]back)\b/,
  performance: /\b(performance|technical|innovat\w*|tech|engineered|functional|weatherproof|breathable)\b/,
  heritage: /\b(heritage|since \d{4}|archive|vintage|tradition\w*|legacy|family[- ]run|generations?)\b/,
  community: /\b(community|club|inclusive|together|collective|crew|everyone|belong\w*)\b/,
  bold: /\b(bold|loud|daring|provocative|statement|rebel\w*|unapologetic|edgy|electric)\b/,
};

const SIGNAL_TONES: Record<Signal, string[]> = {
  sustainable: ["Honest", "Considered"],
  craft: ["Tactile", "Human"],
  luxury: ["Refined", "Assured"],
  playful: ["Playful", "Warm"],
  minimal: ["Quiet", "Precise"],
  performance: ["Kinetic", "Purposeful"],
  heritage: ["Grounded", "Storied"],
  community: ["Inclusive", "Generous"],
  bold: ["Bold", "Provocative"],
};

export const PILLARS: Record<Signal, { title: string; description: (b: string) => string }> = {
  sustainable: { title: "Radical transparency", description: (b) => `Show where ${b} comes from — materials, makers, impact — as proof, not a footnote.` },
  craft: { title: "Made by people", description: (b) => `Put the hands and processes behind ${b} on camera. Craft is the luxury signal.` },
  luxury: { title: "Quiet confidence", description: (b) => `Let ${b} feel inevitable: fewer words, better light, nothing to prove.` },
  playful: { title: "Joy as strategy", description: (b) => `Give people a reason to smile and share — ${b} should feel like an invitation.` },
  minimal: { title: "Less, but better", description: (b) => `Strip every frame back until only ${b} and the feeling remain.` },
  performance: { title: "Built to move", description: (b) => `Demonstrate, don't describe — show ${b} working in motion.` },
  heritage: { title: "Living archive", description: (b) => `Connect ${b}'s past to how people wear it now.` },
  community: { title: "Worn together", description: (b) => `Cast the community, not models — ${b} is something people share.` },
  bold: { title: "Say it louder", description: (b) => `Take a clear position. ${b} should be impossible to scroll past.` },
};

export interface BriefAnalysis {
  brand: string;
  category: Category;
  categoryLabel: string;
  noun: string;
  materials: string[];
  signals: Signal[];
  matchedWords: string[];
  tones: string[];
  goalType: GoalType;
  product: string;
  essence: string;
  audience: string;
  audienceProvided: boolean;
  platforms: Platform[];
  durationSec: number;
  seed: number;
  linkCount: number;
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function firstClause(s: string, max = 70): string {
  const clause = s.split(/[.\n;:!?]|\s[—–-]\s/)[0]?.trim() ?? "";
  const cut = clause.length > max ? `${clause.slice(0, max).replace(/\s+\S*$/, "")}…` : clause;
  return cut.replace(/[,:]$/, "");
}

export function lowerFirst(s: string): string {
  return s && !/^[A-Z]{2}/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
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

  // Prefer a category named in the product description, then the brand description.
  const order = Object.keys(CATEGORIES).filter((c) => c !== "fashion") as Category[];
  const category =
    order.find((c) => CATEGORIES[c].patterns.test(productCorpus)) ??
    order.find((c) => CATEGORIES[c].patterns.test(corpus)) ??
    "fashion";

  const matchedWords = new Set<string>();
  const signals = (Object.keys(SIGNAL_PATTERNS) as Signal[]).filter((s) => {
    const m = corpus.match(SIGNAL_PATTERNS[s]);
    if (m) matchedWords.add(m[0]);
    return Boolean(m);
  });
  const catMatch = corpus.match(CATEGORIES[category].patterns);
  if (catMatch) matchedWords.add(catMatch[0]);

  const tones = Array.from(new Set(signals.flatMap((s) => SIGNAL_TONES[s])));
  for (const fallback of ["Cinematic", "Confident", "Modern", "Sensory"]) {
    if (tones.length >= 4) break;
    if (!tones.includes(fallback)) tones.push(fallback);
  }

  const audienceProvided = Boolean(brief.audience?.trim());
  const audience = audienceProvided
    ? brief.audience.trim()
    : signals.includes("luxury")
      ? "Style-literate buyers who invest in fewer, better pieces"
      : signals.includes("community") || signals.includes("playful")
        ? "Culturally switched-on 18–30s who discover brands through creators and friends"
        : signals.includes("sustainable")
          ? "Conscious shoppers who want proof, not promises, about how clothes are made"
          : "Style-aware shoppers who discover new brands on Instagram and TikTok";

  return {
    brand: brief.brandName.trim(),
    category,
    categoryLabel: CATEGORIES[category].label,
    noun: CATEGORIES[category].noun,
    materials: CATEGORIES[category].materials,
    signals,
    matchedWords: Array.from(matchedWords).slice(0, 8),
    tones: tones.slice(0, 5),
    goalType: detectGoal(brief.goal),
    product: lowerFirst(firstClause(brief.productDescription)) || "the new collection",
    essence: firstClause(brief.brandDescription, 140),
    audience,
    audienceProvided,
    platforms: campaignPlatforms(brief),
    durationSec: campaignDuration(brief),
    seed: hashString(`${brief.brandName}|${brief.productDescription}`.toLowerCase()),
    linkCount: brief.socialLinks.length + brief.websiteLinks.length + brief.videoLinks.length,
  };
}
