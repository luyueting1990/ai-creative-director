import { describe, expect, it } from "vitest";
import { generateDemoCampaign } from "./demo";
import { projectToMarkdown, slugify } from "./export";
import { brief } from "@/test/fixtures";

describe("projectToMarkdown", () => {
  const md = projectToMarkdown({ name: "Salt Light", brief, campaign: generateDemoCampaign(brief) });

  it("includes brief, all concepts and every section", () => {
    expect(md).toMatch(/^# Salt Light/);
    expect(md).toContain("- **Brand:** Maison Verre");
    expect(md.match(/^## Concept \d/gm)).toHaveLength(3);
    expect(md).toContain("### Storyboard");
    expect(md).toContain("### Shot list");
    expect(md).toContain("**Instagram** — ");
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
    expect(slugify("Maison Verre — Salt Light!")).toBe("maison-verre-salt-light");
    expect(slugify("***")).toBe("campaign");
  });
});
