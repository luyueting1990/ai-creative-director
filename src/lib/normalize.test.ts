import { describe, expect, it } from "vitest";
import { InvalidGenerationError, normalizeGeneratedCampaign } from "./normalize";
import type { GeneratedCampaign } from "./prompt";
import { brief, sequentialIds } from "@/test/fixtures";

function rawConcept(title: string): GeneratedCampaign["concepts"][number] {
  return {
    title: ` ${title} `,
    tagline: "Tagline",
    bigIdea: "Idea",
    visualDirection: "Direction",
    soundtrack: "Music",
    palette: [
      { name: "Bone", hex: "f3ebdd" },
      { name: "Short", hex: "#abc" },
      { name: "Broken", hex: "not-a-colour" },
    ],
    storyboard: [{ title: "F1", visual: "v", audio: "a", onScreenText: "", durationSec: 500 }],
    shotList: [{ shotType: "Wide", description: "d", camera: "c", location: "l", talent: "t", durationSec: 3.333 }],
    captions: [
      { platform: "instagram", text: "Hi", hashtags: ["Linen", "#Summer", "  "] },
      { platform: "linkedin", text: "Not requested", hashtags: [] },
    ],
  };
}

const raw: GeneratedCampaign = { concepts: [rawConcept("A"), rawConcept("B"), rawConcept("C"), rawConcept("D")] };

describe("normalizeGeneratedCampaign", () => {
  const out = normalizeGeneratedCampaign(raw, brief, "claude-opus-5-5", sequentialIds());

  it("keeps exactly three concepts and trims text", () => {
    expect(out.concepts.map((c) => c.title)).toEqual(["A", "B", "C"]);
    expect(out.source).toBe("claude");
    expect(out.model).toBe("claude-opus-5-5");
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

  it("filters captions to requested platforms and normalises hashtags", () => {
    const caps = out.concepts[0].captions;
    expect(caps).toHaveLength(1);
    expect(caps[0].hashtags).toEqual(["#Linen", "#Summer"]);
  });

  it("rejects responses with fewer than three concepts", () => {
    expect(() =>
      normalizeGeneratedCampaign({ concepts: [rawConcept("A")] }, brief, "m"),
    ).toThrow(InvalidGenerationError);
  });

  it("rejects concepts without a storyboard", () => {
    const bad = { concepts: [rawConcept("A"), rawConcept("B"), { ...rawConcept("C"), storyboard: [] }] };
    expect(() => normalizeGeneratedCampaign(bad, brief, "m")).toThrow(/missing a storyboard/);
  });
});
