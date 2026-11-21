import { describe, expect, it } from "vitest";
import { InvalidGenerationError, normalizeGeneratedCampaign } from "./normalize";
import { brief, sequentialIds } from "@/test/fixtures";
import { rawCampaign, rawConcept, rawOverview } from "@/test/generated";

describe("normalizeGeneratedCampaign", () => {
  const out = normalizeGeneratedCampaign(rawCampaign(4), brief, "claude-opus-5-5", sequentialIds());

  it("keeps exactly three concepts, trims text and keeps the overview", () => {
    expect(out.concepts.map((c) => c.title)).toEqual(["A", "B", "C"]);
    expect(out.source).toBe("claude");
    expect(out.overview.summary).toBe("Summary");
  });

  it("repairs hex codes and drops invalid swatches", () => {
    expect(out.concepts[0].palette).toEqual([
      { name: "Bone", hex: "#F3EBDD" },
      { name: "Short", hex: "#AABBCC" },
    ]);
  });

  it("clamps durations", () => {
    expect(out.concepts[0].storyboard[0].durationSec).toBe(120);
    expect(out.concepts[0].shotList[0].durationSec).toBe(3.3);
  });

  it("keeps only TikTok/Instagram hooks and captions for the campaign platforms", () => {
    expect(out.concepts[0].hooks.map((h) => h.platform)).toEqual(["tiktok"]);
    const caps = out.concepts[0].captions;
    expect(caps).toHaveLength(1);
    expect(caps[0].hashtags).toEqual(["#Linen", "#Summer"]);
  });

  it("rejects responses with fewer than three concepts", () => {
    expect(() => normalizeGeneratedCampaign(rawCampaign(1), brief, "m")).toThrow(InvalidGenerationError);
  });

  it("rejects concepts without a storyboard", () => {
    const bad = { overview: rawOverview, concepts: [rawConcept("A"), rawConcept("B"), { ...rawConcept("C"), storyboard: [] }] };
    expect(() => normalizeGeneratedCampaign(bad, brief, "m")).toThrow(/missing a storyboard/);
  });
});
