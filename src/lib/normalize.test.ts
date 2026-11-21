import { describe, expect, it } from "vitest";
import { InvalidGenerationError, normalizeGeneratedCampaign } from "./normalize";
import { brief, sequentialIds } from "@/test/fixtures";
import { rawCampaign, rawConcept, rawRead } from "@/test/generated";

describe("normalizeGeneratedCampaign", () => {
  const out = normalizeGeneratedCampaign(rawCampaign(4), brief, "claude-opus-5-5", sequentialIds());

  it("keeps exactly three concepts and the brief read", () => {
    expect(out.concepts.map((c) => c.title)).toEqual(["A", "B", "C"]);
    expect(out.read.summary).toBe("Summary");
    expect(out.source).toBe("claude");
  });

  it("repairs hex codes and clamps durations", () => {
    expect(out.concepts[0].palette).toEqual([
      { name: "Bone", hex: "#F3EBDD" },
      { name: "Short", hex: "#AABBCC" },
    ]);
    expect(out.concepts[0].shots[0].durationSec).toBe(60);
  });

  it("keeps only TikTok/Instagram hooks and captions for the campaign platforms", () => {
    expect(out.concepts[0].hooks.map((h) => h.platform)).toEqual(["tiktok"]);
    expect(out.concepts[0].captions).toHaveLength(1);
    expect(out.concepts[0].captions[0].hashtags).toEqual(["#Linen", "#Summer"]);
  });

  it("rejects too few concepts or concepts without shots", () => {
    expect(() => normalizeGeneratedCampaign(rawCampaign(1), brief, "m")).toThrow(InvalidGenerationError);
    const bad = { read: rawRead, concepts: [rawConcept("A"), rawConcept("B"), { ...rawConcept("C"), shots: [] }] };
    expect(() => normalizeGeneratedCampaign(bad, brief, "m")).toThrow(/has no shots/);
  });
});
