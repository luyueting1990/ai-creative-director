import type { GeneratedCampaign } from "@/lib/prompt";

/** A raw model-output concept, as Claude would return it before normalisation. */
export function rawConcept(title: string): GeneratedCampaign["concepts"][number] {
  return {
    title: ` ${title} `,
    idea: "Idea",
    rationale: "Because",
    look: { setting: "Studio", lighting: "Soft", styling: "Minimal" },
    music: "Piano",
    palette: [
      { name: "Bone", hex: "f3ebdd" },
      { name: "Short", hex: "#abc" },
      { name: "Broken", hex: "not-a-colour" },
    ],
    shots: [
      {
        title: "Open",
        description: "d",
        durationSec: 500,
        showsProduct: true,
        onScreenText: "",
        camera: "50mm",
        setting: "Studio",
        direction: "dir",
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

export const rawRead: GeneratedCampaign["read"] = { summary: "Summary", tone: ["Calm"] };

export function rawCampaign(n = 3): GeneratedCampaign {
  return { read: rawRead, concepts: Array.from({ length: n }, (_, i) => rawConcept(String.fromCharCode(65 + i))) };
}
