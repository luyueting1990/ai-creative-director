import { describe, expect, it } from "vitest";
import { CampaignSchema, type Brief } from "../schema";
import { analyzeBrief, detectGoal, firstClause, lowerFirst } from "./analyze";
import { ARCHETYPES, distributeDuration, pickArchetypes, selectShots, shotCountFor } from "./archetypes";
import { article, generateDemoCampaign, hashtagify } from "./index";
import { brief, sequentialIds } from "@/test/fixtures";

const gen = (b: Brief = brief, photoCount = 0) =>
  generateDemoCampaign(b, { photoCount, idFactory: sequentialIds(), now: new Date("2026-01-01T00:00:00Z") });

const plain: Brief = {
  ...brief,
  brandName: "Kova",
  brandDescription: "We make everyday clothes for people in the city.",
  productDescription: "The new autumn jacket",
};

describe("analyzeBrief", () => {
  const a = analyzeBrief(brief);

  it("detects category, signals and goal from the brief text", () => {
    expect(a.category).toBe("knitwear");
    expect(a.signals).toEqual(expect.arrayContaining(["sustainable", "craft", "playful"]));
    expect(a.goalType).toBe("launch");
  });

  it("takes a short product phrase from the user's own words", () => {
    expect(a.product).toBe("the Winter Bloom capsule");
    expect(analyzeBrief(plain).product).toBe("the new autumn jacket");
  });

  it.each([
    ["Drive sales on our webshop", "conversion"],
    ["Grow our run club community", "community"],
    ["Reposition the brand for a younger audience", "repositioning"],
    ["Be known in Paris", "awareness"],
  ])("reads goal %s as %s", (goal, type) => {
    expect(detectGoal(goal)).toBe(type);
  });

  it("handles text helpers", () => {
    expect(firstClause("Hello world: more text")).toBe("Hello world");
    expect(lowerFirst("The Winter Bloom capsule")).toBe("the Winter Bloom capsule");
    expect(lowerFirst("Winter Bloom capsule")).toBe("Winter Bloom capsule");
    expect(lowerFirst("Oversized cardigans")).toBe("oversized cardigans");
  });
});

describe("format helpers", () => {
  it("uses 4–6 shots depending on length", () => {
    expect([15, 30, 45, 60].map(shotCountFor)).toEqual([4, 5, 6, 6]);
  });

  it("keeps first and last shots when sampling", () => {
    const picked = selectShots(ARCHETYPES[0].shots, 4);
    expect(picked).toHaveLength(4);
    expect(picked[0]).toBe(ARCHETYPES[0].shots[0]);
    expect(picked.at(-1)).toBe(ARCHETYPES[0].shots.at(-1));
  });

  it("splits durations that sum exactly to the target", () => {
    for (const total of [15, 30, 45, 60]) {
      const d = distributeDuration([1, 1.2, 1, 1.3, 0.7], total);
      expect(d.reduce((s, n) => s + n, 0)).toBe(total);
    }
  });

  it("only offers the process format when the brief mentions craft, sustainability or heritage", () => {
    expect(pickArchetypes(analyzeBrief(brief)).map((p) => p.key)).toContain("process");
    for (const seedBrand of ["Kova", "Lumen", "Rue", "Oro", "Fen"]) {
      expect(pickArchetypes(analyzeBrief({ ...plain, brandName: seedBrand })).map((p) => p.key)).not.toContain("process");
    }
  });

  it("favours motion for performance wear", () => {
    const athletic = analyzeBrief({ ...plain, brandDescription: "Technical performance running wear.", productDescription: "Running tights" });
    expect(pickArchetypes(athletic)[0].key).toBe("motion");
  });
});

describe("generateDemoCampaign", () => {
  const campaign = gen();

  it("returns a valid campaign with three distinct, concise concepts", () => {
    expect(CampaignSchema.safeParse(campaign).success).toBe(true);
    expect(new Set(campaign.concepts.map((c) => c.title)).size).toBe(3);
    for (const c of campaign.concepts) {
      expect(c.idea.split(/[.!?](\s|$)/).filter((s) => s.trim()).length).toBe(1); // one sentence
      expect(c.idea.length).toBeLessThan(160);
    }
  });

  it("builds 4–6 shots that add up to the chosen length", () => {
    for (const [durationSec, count] of [
      [15, 4],
      [30, 5],
      [60, 6],
    ] as const) {
      for (const c of gen({ ...brief, durationSec }).concepts) {
        expect(c.shots).toHaveLength(count);
        expect(c.shots.reduce((s, x) => s + x.durationSec, 0)).toBe(durationSec);
      }
    }
  });

  it("writes hooks for TikTok and Instagram and captions for chosen platforms", () => {
    const c = campaign.concepts[0];
    expect(c.hooks.map((h) => h.platform).sort()).toEqual(["instagram", "instagram", "tiktok", "tiktok"]);
    expect(gen({ ...brief, platforms: ["youtube"] }).concepts[0].captions.map((x) => x.platform)).toEqual(["youtube"]);
  });

  it("doesn't invent product facts the brief didn't mention", () => {
    const text = JSON.stringify(gen(plain)).toLowerCase();
    for (const claim of ["recycled", "handmade", "organic", "merino", "silk", "leather", "sustainab", "now available", "award"]) {
      expect(text).not.toContain(claim);
    }
  });

  it("describes photos and links as references, never as analysed", () => {
    const withPhotos = gen(brief, 3);
    const notes = withPhotos.read.notes.join(" ");
    expect(notes).toMatch(/3 photos used as visual references \(not analysed\)/);
    expect(notes).toMatch(/2 links saved for reference \(not opened\)/);
  });

  it("is deterministic apart from ids", () => {
    expect(gen()).toEqual(gen());
  });
});

describe("copy helpers", () => {
  it("builds hashtags and articles", () => {
    expect(hashtagify("Café Noir")).toBe("#CafeNoir");
    expect(hashtagify("***")).toBe("#NewCollection");
    expect(article("Honest")).toBe("an");
    expect(article("Bold")).toBe("a");
  });
});
