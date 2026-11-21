import { describe, expect, it } from "vitest";
import { BriefSchema, GenerateRequestSchema, campaignDuration, campaignPlatforms } from "./schema";
import { brief } from "@/test/fixtures";

describe("BriefSchema", () => {
  it("accepts only the required fields and applies defaults", () => {
    const parsed = BriefSchema.parse({
      brandName: "Noor",
      brandDescription: "Handmade knitwear brand.",
      productDescription: "Cardigans",
      goal: "Launch it",
    });
    expect(parsed).toMatchObject({ links: [], platforms: [], audience: "" });
    expect(campaignPlatforms(parsed)).toEqual(["instagram", "tiktok"]);
    expect(campaignDuration(parsed)).toBe(30);
  });

  it.each([
    [{ brandName: "  " }, "Add your brand name"],
    [{ brandDescription: "short" }, "Describe the brand in a sentence or two"],
    [{ productDescription: "" }, "Describe the product or collection"],
    [{ goal: "" }, "Add a campaign goal"],
  ])("rejects %o", (patch, message) => {
    const r = BriefSchema.safeParse({ ...brief, ...patch });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe(message);
  });

  it("accepts any http(s) links, up to the limit", () => {
    expect(BriefSchema.safeParse({ ...brief, links: ["https://youtu.be/x", "https://tiktok.com/@a"] }).success).toBe(true);
    expect(BriefSchema.safeParse({ ...brief, links: ["not a url"] }).success).toBe(false);
    expect(BriefSchema.safeParse({ ...brief, links: Array(9).fill("https://a.com") }).success).toBe(false);
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
