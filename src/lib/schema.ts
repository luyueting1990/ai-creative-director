import { z } from "zod";
import { classifyLink, isHttpUrl } from "./links";

/**
 * Domain schemas shared by the client, the API route and the Claude integration.
 * Zod is the single source of truth: TypeScript types are inferred from it and
 * every boundary (HTTP body, model output, localStorage) is validated with it.
 */

export const PLATFORMS = ["instagram", "tiktok", "youtube", "pinterest", "x", "linkedin"] as const;
export const PlatformSchema = z.enum(PLATFORMS);
export type Platform = z.infer<typeof PlatformSchema>;

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  x: "X",
  linkedin: "LinkedIn",
};

/** Platforms used when the brief doesn't specify any. */
export const DEFAULT_PLATFORMS: Platform[] = ["instagram", "tiktok"];

export const DURATIONS = [15, 30, 45, 60] as const;
export const DEFAULT_DURATION = 30;

export const MAX_LINKS = 6;
export const MAX_PHOTOS = 6;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);

const url = z
  .string()
  .trim()
  .max(500, "That link is too long")
  .refine(isHttpUrl, "Enter a full link starting with https://");

const linkList = (check?: (u: string) => boolean, message?: string) =>
  z
    .array(url)
    .max(MAX_LINKS, `Add up to ${MAX_LINKS} links`)
    .refine((list) => !check || list.every(check), message ?? "Unsupported link")
    .default([]);

export const BriefSchema = z.object({
  brandName: text(80).min(1, "Brand name is required"),
  brandDescription: text(1200).min(10, "Describe the brand in a sentence or two"),
  productDescription: text(800).min(5, "Describe the product or collection"),
  socialLinks: linkList(
    (u) => ["instagram", "tiktok"].includes(classifyLink(u)),
    "Social links must be Instagram or TikTok URLs",
  ),
  websiteLinks: linkList(),
  videoLinks: linkList(
    (u) => ["youtube", "instagram", "tiktok"].includes(classifyLink(u)),
    "Video links must be YouTube, Instagram Reels or TikTok URLs",
  ),
  goal: text(400).min(5, "What should this campaign achieve?"),
  platforms: z.array(PlatformSchema).max(PLATFORMS.length).default([]),
  audience: text(400).optional().default(""),
  durationSec: z
    .number()
    .int()
    .refine((n) => (DURATIONS as readonly number[]).includes(n), "Choose 15, 30, 45 or 60 seconds")
    .optional(),
});
export type Brief = z.infer<typeof BriefSchema>;
export type BriefInput = z.input<typeof BriefSchema>;

export const EMPTY_BRIEF: BriefInput = {
  brandName: "",
  brandDescription: "",
  productDescription: "",
  socialLinks: [],
  websiteLinks: [],
  videoLinks: [],
  goal: "",
  platforms: [],
  audience: "",
  durationSec: undefined,
};

/** Effective platforms / duration after defaults are applied. */
export function campaignPlatforms(brief: Pick<Brief, "platforms">): Platform[] {
  return brief.platforms.length ? brief.platforms : DEFAULT_PLATFORMS;
}
export function campaignDuration(brief: Pick<Brief, "durationSec">): number {
  return brief.durationSec ?? DEFAULT_DURATION;
}

/* ------------------------------------------------------------------------ */
/* Uploaded photos                                                           */
/* ------------------------------------------------------------------------ */

/**
 * Only photo metadata is persisted. The image itself lives in memory as an
 * object URL for the current browser session (see README → Limitations).
 */
export const PhotoMetaSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  size: z.number().nonnegative(),
  type: z.string().max(100),
});
export type PhotoMeta = z.infer<typeof PhotoMetaSchema>;

/* ------------------------------------------------------------------------ */
/* Generated content                                                         */
/* ------------------------------------------------------------------------ */

export const SwatchSchema = z.object({
  name: z.string(),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected a #RRGGBB colour"),
});
export type Swatch = z.infer<typeof SwatchSchema>;

export const MoodboardSchema = z.object({
  keywords: z.array(z.string()),
  lighting: z.string(),
  styling: z.string(),
  locations: z.string(),
  references: z.array(z.string()),
});
export type Moodboard = z.infer<typeof MoodboardSchema>;

export const FrameSchema = z.object({
  id: z.string(),
  title: z.string(),
  visual: z.string(),
  audio: z.string(),
  onScreenText: z.string(),
  durationSec: z.number().min(0).max(120),
  featuresProduct: z.boolean().default(false),
});
export type Frame = z.infer<typeof FrameSchema>;

export const ShotSchema = z.object({
  id: z.string(),
  shotType: z.string(),
  description: z.string(),
  camera: z.string(),
  movement: z.string().default(""),
  lighting: z.string().default(""),
  location: z.string(),
  talent: z.string(),
  direction: z.string().default(""),
  durationSec: z.number().min(0).max(120),
});
export type Shot = z.infer<typeof ShotSchema>;

export const HookSchema = z.object({
  id: z.string(),
  platform: PlatformSchema,
  text: z.string(),
});
export type Hook = z.infer<typeof HookSchema>;

export const CaptionSchema = z.object({
  id: z.string(),
  platform: PlatformSchema,
  text: z.string(),
  hashtags: z.array(z.string()),
});
export type Caption = z.infer<typeof CaptionSchema>;

export const ConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  tagline: z.string(),
  bigIdea: z.string(),
  whyItWorks: z.string().default(""),
  visualDirection: z.string(),
  moodboard: MoodboardSchema,
  palette: z.array(SwatchSchema),
  soundtrack: z.string(),
  storyboard: z.array(FrameSchema),
  shotList: z.array(ShotSchema),
  hooks: z.array(HookSchema).default([]),
  captions: z.array(CaptionSchema),
});
export type Concept = z.infer<typeof ConceptSchema>;

export const BrandOverviewSchema = z.object({
  summary: z.string(),
  positioning: z.string(),
  audienceInsight: z.string(),
  toneKeywords: z.array(z.string()),
  pillars: z.array(z.object({ title: z.string(), description: z.string() })),
  signals: z.array(z.string()).default([]),
});
export type BrandOverview = z.infer<typeof BrandOverviewSchema>;

export const GenerationSourceSchema = z.enum(["demo", "claude"]);
export type GenerationSource = z.infer<typeof GenerationSourceSchema>;

export const CampaignSchema = z.object({
  overview: BrandOverviewSchema,
  concepts: z.array(ConceptSchema).length(3),
  source: GenerationSourceSchema,
  model: z.string().optional(),
  generatedAt: z.string(),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  brief: BriefSchema,
  photos: z.array(PhotoMetaSchema).max(MAX_PHOTOS).default([]),
  campaign: CampaignSchema,
  selectedConceptId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Project = z.infer<typeof ProjectSchema>;

/* ------------------------------------------------------------------------ */
/* API contract                                                              */
/* ------------------------------------------------------------------------ */

export const GenerateRequestSchema = z.object({
  brief: BriefSchema,
  photoCount: z.number().int().min(0).max(MAX_PHOTOS).default(0),
  mode: z.enum(["demo", "live"]).default("demo"),
});
export type GenerateRequest = z.input<typeof GenerateRequestSchema>;

export type ApiErrorCode =
  | "INVALID_REQUEST"
  | "LIVE_UNAVAILABLE"
  | "RATE_LIMITED"
  | "UPSTREAM_AUTH"
  | "UPSTREAM_RATE_LIMITED"
  | "UPSTREAM_REFUSED"
  | "UPSTREAM_INVALID_OUTPUT"
  | "UPSTREAM_ERROR";

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string; details?: unknown };
}

export interface GenerateResponseBody {
  campaign: Campaign;
}

export interface StatusResponseBody {
  liveAvailable: boolean;
  model: string;
}
