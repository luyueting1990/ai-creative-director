import { describe, expect, it } from "vitest";
import { generateDemoCampaign } from "./demo";
import { projectToMarkdown, slugify } from "./export";
import { brief } from "@/test/fixtures";

describe("projectToMarkdown", () => {
  const campaign = generateDemoCampaign(brief, { photoCount: 1 });
  const chosen = campaign.concepts[1];
  const md = projectToMarkdown({
    name: "Winter Bloom",
    brief,
    photos: [{ id: "p1", name: "look-1.jpg", size: 1, type: "image/jpeg" }],
    campaign,
    selectedConceptId: chosen.id,
  });

  it("exports the selected concept in full and the others briefly", () => {
    expect(md).toMatch(/^# Winter Bloom/);
    expect(md).toContain("demo mode by a rule-based engine");
    expect(md).toContain(`## Concept: ${chosen.title}`);
    expect(md).toContain("### Storyboard");
    expect(md).toContain("### Hooks");
    expect(md).toContain("### Captions");
    expect(md).toContain("## Other concepts");
    for (const other of campaign.concepts.filter((c) => c.id !== chosen.id)) expect(md).toContain(`- **${other.title}** — ${other.idea}`);
  });

  it("includes the brief, photo names and links", () => {
    expect(md).toContain("- **Brand:** Atelier Noor");
    expect(md).toContain("- **Reference photos:** look-1.jpg");
    expect(md).toContain("  - Instagram: https://instagram.com/ateliernoor");
  });

  it("escapes pipes inside table cells", () => {
    const c = generateDemoCampaign(brief);
    c.concepts[0].shots[0].description = "a | b";
    expect(projectToMarkdown({ name: "x", brief, campaign: c })).toContain("a \\| b");
  });
});

describe("slugify", () => {
  it("creates safe file names", () => {
    expect(slugify("Atelier Noor — Winter Bloom!")).toBe("atelier-noor-winter-bloom");
    expect(slugify("***")).toBe("campaign");
  });
});
