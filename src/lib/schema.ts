import { z } from "zod";

/**
 * Domain schemas shared by the client, the API route and the Claude integration.
 * Zod is the single source of truth: TypeScript types are inferred from it and
 * every boundary (HTTP body, Claude output, localStorage) is validated with it.
 */

export const PLATFORMS = [
  "instagram",
  "tiktok",
  "youtube",
  "pinterest",
  "x",
  "linkedin",
] as const;

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

const text = (max: number) => z.string().trim().max(max);

export const BriefSchema = z.object({
  brandName: text(80).min(1, "Brand name is required"),
  collection: text(160).min(1, "Collection or product is required"),
  audience: text(400).min(1, "Target audience is required"),
  goal: text(400).min(1, "Campaign goal is required"),
  tone: text(200).min(1, "Brand tone is required"),
  platforms: z.array(PlatformSchema).min(1, "Pick at least one platform").max(PLATFORMS.length),
  notes: text(1200).optional().default(""),
});
export type Brief = z.infer<typeof BriefSchema>;
export type BriefInput = z.input<typeof BriefSchema>;

/* ------------------------------------------------------------------------ */
/* Generated content                                                         */
/* ------------------------------------------------------------------------ */

export const SwatchSchema = z.object({
  name: z.string(),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected a #RRGGBB colour"),
});
export type Swatch = z.infer<typeof SwatchSchema>;

export const FrameSchema = z.object({
  id: z.string(),
  title: z.string(),
  visual: z.string(),
  audio: z.string(),
  onScreenText: z.string(),
  durationSec: z.number().min(0).max(120),
});
export type Frame = z.infer<typeof FrameSchema>;

export const ShotSchema = z.object({
  id: z.string(),
  shotType: z.string(),
  description: z.string(),
  camera: z.string(),
  location: z.string(),
  talent: z.string(),
  durationSec: z.number().min(0).max(120),
});
export type Shot = z.infer<typeof ShotSchema>;

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
  visualDirection: z.string(),
  palette: z.array(SwatchSchema),
  soundtrack: z.string(),
  storyboard: z.array(FrameSchema),
  shotList: z.array(ShotSchema),
  captions: z.array(CaptionSchema),
});
export type Concept = z.infer<typeof ConceptSchema>;

export const GenerationSourceSchema = z.enum(["demo", "claude"]);
export type GenerationSource = z.infer<typeof GenerationSourceSchema>;

export const CampaignSchema = z.object({
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
