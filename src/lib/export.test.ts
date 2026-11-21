import { describe, expect, it } from "vitest";
import { generateDemoCampaign } from "./demo";
import { projectToMarkdown, slugify } from "./export";
import { brief } from "@/test/fixtures";

describe("projectToMarkdown", () => {
  const md = projectToMarkdown({
    name: "Winter Bloom",
    brief,
    photos: [{ id: "p1", name: "look-1.jpg", size: 1, type: "image/jpeg" }],
    campaign: generateDemoCampaign(brief, { photoCount: 1 }),
  });

  it("includes the demo disclaimer, brief, overview, all concepts and every section", () => {
    expect(md).toMatch(/^# Winter Bloom/);
    expect(md).toContain("Illustrative demo content");
    expect(md).toContain("- **Brand:** Atelier Noor");
    expect(md).toContain("- **Product photos:** look-1.jpg");
    expect(md).toContain("  - Instagram: https://instagram.com/ateliernoor");
    expect(md).toContain("## Brand overview");
    expect(md.match(/^## Concept \d/gm)).toHaveLength(3);
    for (const h of ["### Moodboard", "### Storyboard", "### Shot list", "### Hooks", "### Captions"]) expect(md).toContain(h);
    expect(md).toContain("**TikTok:** ");
    expect(md).toContain("_Generated");
  });

  it("escapes pipes inside table cells", () => {
    const campaign = generateDemoCampaign(brief);
    campaign.concepts[0].storyboard[0].visual = "a | b";
    expect(projectToMarkdown({ name: "x", brief, campaign })).toContain("a \\| b");
  });
});

describe("slugify", () => {
  it("creates safe file names", () => {
    expect(slugify("Atelier Noor — Winter Bloom!")).toBe("atelier-noor-winter-bloom");
    expect(slugify("***")).toBe("campaign");
  });
});
