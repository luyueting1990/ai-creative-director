import type { GeneratedCampaign } from "@/lib/prompt";

/** A raw model-output concept, as Claude would return it before normalisation. */
export function rawConcept(title: string): GeneratedCampaign["concepts"][number] {
  return {
    title: ` ${title} `,
    tagline: "Tagline",
    bigIdea: "Idea",
    whyItWorks: "Because",
    visualDirection: "Direction",
    moodboard: { keywords: ["k"], lighting: "l", styling: "s", locations: "loc", references: ["r"] },
    soundtrack: "Music",
    palette: [
      { name: "Bone", hex: "f3ebdd" },
      { name: "Short", hex: "#abc" },
      { name: "Broken", hex: "not-a-colour" },
    ],
    storyboard: [{ title: "F1", visual: "v", audio: "a", onScreenText: "", durationSec: 500, featuresProduct: true }],
    shotList: [
      {
        shotType: "Wide",
        description: "d",
        camera: "c",
        movement: "m",
        lighting: "l",
        location: "l",
        talent: "t",
        direction: "dir",
        durationSec: 3.333,
      },
    ],
    hooks: [
      { platform: "tiktok", text: "Hook" },
      { platform: "linkedin", text: "Dropped" },
    ],
    captions: [
      { platform: "instagram", text: "Hi", hashtags: ["Linen", "#Summer", "  "] },
      { platform: "linkedin", text: "Not requested", hashtags: [] },
    ],
  };
}

export const rawOverview: GeneratedCampaign["overview"] = {
  summary: "Summary",
  positioning: "Positioning",
  audienceInsight: "Audience",
  toneKeywords: ["Calm"],
  pillars: [{ title: "P", description: "D" }],
};

export function rawCampaign(n = 3): GeneratedCampaign {
  return { overview: rawOverview, concepts: Array.from({ length: n }, (_, i) => rawConcept(String.fromCharCode(65 + i))) };
}
