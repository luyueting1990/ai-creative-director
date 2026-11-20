import { describe, expect, it } from "vitest";
import { generateDemoCampaign, hashtagify } from "./demo";
import { CampaignSchema } from "./schema";
import { brief, sequentialIds } from "@/test/fixtures";

describe("generateDemoCampaign", () => {
  const campaign = generateDemoCampaign(brief, sequentialIds(), new Date("2026-01-01T00:00:00Z"));

  it("returns a schema-valid campaign with exactly three concepts", () => {
    expect(CampaignSchema.safeParse(campaign).success).toBe(true);
    expect(campaign.concepts).toHaveLength(3);
    expect(campaign.source).toBe("demo");
  });

  it("produces distinct concepts with storyboards, shot lists and palettes", () => {
    const titles = new Set(campaign.concepts.map((c) => c.title));
    expect(titles.size).toBe(3);
    for (const c of campaign.concepts) {
      expect(c.storyboard.length).toBeGreaterThanOrEqual(5);
      expect(c.shotList.length).toBeGreaterThanOrEqual(4);
      expect(c.palette.length).toBe(5);
    }
  });

  it("personalises copy with the brief", () => {
    const text = JSON.stringify(campaign);
    expect(text).toContain("Maison Verre");
    expect(text).toContain("Salt Light linen");
    expect(campaign.concepts[0].captions[0].hashtags).toContain("#MaisonVerre");
  });

  it("writes one caption per requested platform", () => {
    for (const c of campaign.concepts) {
      expect(c.captions.map((x) => x.platform)).toEqual(["instagram", "tiktok"]);
    }
  });

  it("assigns unique ids", () => {
    const ids = campaign.concepts.flatMap((c) => [
      c.id,
      ...c.storyboard.map((f) => f.id),
      ...c.shotList.map((s) => s.id),
      ...c.captions.map((x) => x.id),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is deterministic apart from ids", () => {
    const a = generateDemoCampaign(brief, sequentialIds(), new Date(0));
    const b = generateDemoCampaign(brief, sequentialIds(), new Date(0));
    expect(a).toEqual(b);
  });
});

describe("hashtagify", () => {
  it("builds PascalCase hashtags and strips punctuation", () => {
    expect(hashtagify("sora athletic!")).toBe("#SoraAthletic");
    expect(hashtagify("Café Noir")).toBe("#CafeNoir");
    expect(hashtagify("***")).toBe("#NewCollection");
  });
});
