import { describe, expect, it } from "vitest";
import { BriefSchema, GenerateRequestSchema, campaignDuration, campaignPlatforms } from "./schema";
import { brief } from "@/test/fixtures";

describe("BriefSchema", () => {
  it("accepts a brief with only the required fields and applies defaults", () => {
    const parsed = BriefSchema.parse({
      brandName: "Noor",
      brandDescription: "Handmade knitwear brand.",
      productDescription: "Cardigans",
      goal: "Launch it",
    });
    expect(parsed).toMatchObject({ socialLinks: [], websiteLinks: [], videoLinks: [], platforms: [], audience: "" });
    expect(campaignPlatforms(parsed)).toEqual(["instagram", "tiktok"]);
    expect(campaignDuration(parsed)).toBe(30);
  });

  it.each([
    [{ brandName: "  " }, "Brand name is required"],
    [{ brandDescription: "short" }, "Describe the brand in a sentence or two"],
    [{ productDescription: "" }, "Describe the product or collection"],
    [{ goal: "" }, "What should this campaign achieve?"],
  ])("rejects %o", (patch, message) => {
    const r = BriefSchema.safeParse({ ...brief, ...patch });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe(message);
  });

  it("only accepts Instagram/TikTok social links", () => {
    expect(BriefSchema.safeParse({ ...brief, socialLinks: ["https://www.tiktok.com/@noor"] }).success).toBe(true);
    const r = BriefSchema.safeParse({ ...brief, socialLinks: ["https://facebook.com/noor"] });
    expect(r.error?.issues[0].message).toMatch(/Instagram or TikTok/);
  });

  it("only accepts YouTube, Reels or TikTok video links", () => {
    expect(BriefSchema.safeParse({ ...brief, videoLinks: ["https://youtu.be/abc", "https://instagram.com/reel/x"] }).success).toBe(true);
    expect(BriefSchema.safeParse({ ...brief, videoLinks: ["https://vimeo.com/1"] }).success).toBe(false);
  });

  it("rejects non-URLs and too many links", () => {
    expect(BriefSchema.safeParse({ ...brief, websiteLinks: ["not a url"] }).success).toBe(false);
    expect(BriefSchema.safeParse({ ...brief, websiteLinks: Array(7).fill("https://a.com") }).success).toBe(false);
  });

  it("only allows supported durations", () => {
    expect(BriefSchema.safeParse({ ...brief, durationSec: 45 }).success).toBe(true);
    expect(BriefSchema.safeParse({ ...brief, durationSec: 20 }).success).toBe(false);
  });
});

describe("GenerateRequestSchema", () => {
  it("defaults to demo mode with no photos", () => {
    expect(GenerateRequestSchema.parse({ brief })).toMatchObject({ mode: "demo", photoCount: 0 });
  });
  it("caps the photo count", () => {
    expect(GenerateRequestSchema.safeParse({ brief, photoCount: 7 }).success).toBe(false);
  });
});
