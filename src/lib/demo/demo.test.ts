import { describe, expect, it } from "vitest";
import { CampaignSchema, type Brief } from "../schema";
import { analyzeBrief, detectGoal, firstClause } from "./analyze";
import { ARCHETYPES, distributeDuration, frameCountFor, pickArchetypes, selectBeats } from "./archetypes";
import { article, generateDemoCampaign, hashtagify } from "./index";
import { brief, sequentialIds } from "@/test/fixtures";

const gen = (b: Brief = brief, photoCount = 0) =>
  generateDemoCampaign(b, { photoCount, idFactory: sequentialIds(), now: new Date("2026-01-01T00:00:00Z") });

describe("analyzeBrief", () => {
  const a = analyzeBrief(brief);

  it("detects category, signals and goal from the brief text", () => {
    expect(a.category).toBe("knitwear");
    expect(a.signals).toEqual(expect.arrayContaining(["sustainable", "craft", "playful"]));
    expect(a.goalType).toBe("launch");
    expect(a.matchedWords).toEqual(expect.arrayContaining(["recycled", "playful"]));
  });

  it("extracts a short product phrase and applies defaults", () => {
    expect(a.product).toBe("the Winter Bloom capsule");
    expect(a.platforms).toEqual(["instagram", "tiktok"]);
    expect(a.durationSec).toBe(30);
    expect(a.audienceProvided).toBe(false);
  });

  it("falls back gracefully for sparse briefs", () => {
    const sparse = analyzeBrief({ ...brief, brandDescription: "We make clothes for people.", productDescription: "New stuff" });
    expect(sparse.category).toBe("fashion");
    expect(sparse.tones.length).toBeGreaterThanOrEqual(4);
  });

  it.each([
    ["Drive sales on our webshop", "conversion"],
    ["Grow our run club community", "community"],
    ["Reposition the brand for a younger audience", "repositioning"],
    ["Be known in Paris", "awareness"],
  ])("reads goal %s as %s", (goal, type) => {
    expect(detectGoal(goal)).toBe(type);
  });

  it("cuts clauses at punctuation", () => {
    expect(firstClause("Hello world: more text")).toBe("Hello world");
  });
});

describe("archetype helpers", () => {
  it("maps durations to frame counts", () => {
    expect([15, 30, 45, 60].map(frameCountFor)).toEqual([4, 6, 7, 8]);
  });

  it("keeps first and last beats when sampling", () => {
    const beats = ARCHETYPES[0].beats;
    const picked = selectBeats(beats, 4);
    expect(picked).toHaveLength(4);
    expect(picked[0]).toBe(beats[0]);
    expect(picked.at(-1)).toBe(beats.at(-1));
  });

  it("distributes durations that sum exactly to the target", () => {
    for (const total of [15, 30, 45, 60]) {
      const d = distributeDuration([1, 1.2, 1.4, 1, 0.8, 1.3], total);
      expect(d.reduce((s, n) => s + n, 0)).toBe(total);
      expect(Math.min(...d)).toBeGreaterThanOrEqual(1);
    }
  });

  it("picks three distinct archetypes that suit the brief", () => {
    const picks = pickArchetypes(analyzeBrief(brief));
    expect(new Set(picks.map((p) => p.key)).size).toBe(3);
    expect(picks.map((p) => p.key)).toContain("made-by-hand");

    const athletic = pickArchetypes(
      analyzeBrief({ ...brief, brandDescription: "Technical performance running wear for the city.", productDescription: "Reflective running jacket" }),
    );
    expect(athletic[0].key).toBe("movement-studies");
  });
});

describe("generateDemoCampaign", () => {
  const campaign = gen();

  it("returns a schema-valid campaign with an overview and three distinct concepts", () => {
    expect(CampaignSchema.safeParse(campaign).success).toBe(true);
    expect(new Set(campaign.concepts.map((c) => c.title)).size).toBe(3);
    expect(campaign.overview.pillars).toHaveLength(3);
    expect(campaign.overview.summary).toContain("Atelier Noor");
  });

  it("fits storyboards and shot lists to the requested duration", () => {
    for (const durationSec of [15, 60] as const) {
      for (const c of gen({ ...brief, durationSec }).concepts) {
        const total = c.storyboard.reduce((s, f) => s + f.durationSec, 0);
        expect(total).toBe(durationSec);
        expect(c.shotList).toHaveLength(c.storyboard.length);
      }
    }
  });

  it("writes two TikTok and two Instagram hooks per concept", () => {
    for (const c of campaign.concepts) {
      expect(c.hooks.filter((h) => h.platform === "tiktok")).toHaveLength(2);
      expect(c.hooks.filter((h) => h.platform === "instagram")).toHaveLength(2);
    }
  });

  it("writes captions for the chosen platforms", () => {
    const yt = gen({ ...brief, platforms: ["youtube", "pinterest"] });
    expect(yt.concepts[0].captions.map((c) => c.platform)).toEqual(["youtube", "pinterest"]);
    expect(campaign.concepts[0].captions[0].hashtags).toContain("#AtelierNoor");
  });

  it("references photos and links honestly without claiming analysis", () => {
    const withPhotos = gen(brief, 3);
    const signals = withPhotos.overview.signals.join(" ");
    expect(signals).toMatch(/3 product photos attached as visual references \(not analysed\)/);
    expect(signals).toMatch(/2 reference links saved .* \(not analysed\)/);
    expect(withPhotos.concepts[0].moodboard.references[0]).toMatch(/3 uploaded product photos/);
    expect(JSON.stringify(withPhotos)).not.toMatch(/we analy[sz]ed|analysis of your photos/i);
  });

  it("is deterministic apart from ids and varies across brands", () => {
    expect(gen()).toEqual(gen());
    const other = gen({ ...brief, brandName: "Völt", brandDescription: "Bold, loud streetwear drops for skaters.", productDescription: "Graphic hoodies" });
    expect(other.concepts.map((c) => c.title)).not.toEqual(campaign.concepts.map((c) => c.title));
  });
});

describe("copy helpers", () => {
  it("builds hashtags", () => {
    expect(hashtagify("sora athletic!")).toBe("#SoraAthletic");
    expect(hashtagify("Café Noir")).toBe("#CafeNoir");
    expect(hashtagify("***")).toBe("#NewCollection");
  });
  it("chooses a/an", () => {
    expect(article("Honest")).toBe("an");
    expect(article("Bold")).toBe("a");
    expect(article("Inclusive")).toBe("an");
  });
});
