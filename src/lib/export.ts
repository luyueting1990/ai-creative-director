import { PLATFORM_LABELS, type Brief, type Concept, type Project } from "./schema";
import { totalDuration } from "./editor";

function cell(s: string | number): string {
  return String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/** Renders a project as a client-ready Markdown treatment. */
export function projectToMarkdown(project: Pick<Project, "name" | "brief" | "campaign">): string {
  const { brief, campaign } = project;
  const lines: string[] = [
    `# ${project.name}`,
    "",
    briefSection(brief),
    "",
    ...campaign.concepts.flatMap((c, i) => conceptSection(c, i + 1)),
    `_Generated ${new Date(campaign.generatedAt).toUTCString()} · ${campaign.source === "claude" ? `Claude (${campaign.model ?? "unknown model"})` : "Demo mode"}_`,
    "",
  ];
  return lines.join("\n");
}

function briefSection(b: Brief): string {
  return [
    "## Brief",
    "",
    `- **Brand:** ${b.brandName}`,
    `- **Collection:** ${b.collection}`,
    `- **Audience:** ${b.audience}`,
    `- **Goal:** ${b.goal}`,
    `- **Tone:** ${b.tone}`,
    `- **Platforms:** ${b.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}`,
    ...(b.notes ? [`- **Notes:** ${b.notes}`] : []),
  ].join("\n");
}

function conceptSection(c: Concept, n: number): string[] {
  return [
    `## Concept ${n}: ${c.title}`,
    "",
    `> ${c.tagline}`,
    "",
    `**Big idea.** ${c.bigIdea}`,
    "",
    `**Visual direction.** ${c.visualDirection}`,
    "",
    `**Soundtrack.** ${c.soundtrack}`,
    "",
    `**Palette.** ${c.palette.map((s) => `${s.name} \`${s.hex}\``).join(" · ")}`,
    "",
    `### Storyboard (${totalDuration(c.storyboard)}s)`,
    "",
    "| # | Frame | Visual | Audio | On-screen text | Sec |",
    "|---|---|---|---|---|---|",
    ...c.storyboard.map(
      (f, i) =>
        `| ${i + 1} | ${cell(f.title)} | ${cell(f.visual)} | ${cell(f.audio)} | ${cell(f.onScreenText || "—")} | ${f.durationSec} |`,
    ),
    "",
    "### Shot list",
    "",
    "| # | Shot | Description | Camera | Location | Talent | Sec |",
    "|---|---|---|---|---|---|---|",
    ...c.shotList.map(
      (s, i) =>
        `| ${i + 1} | ${cell(s.shotType)} | ${cell(s.description)} | ${cell(s.camera)} | ${cell(s.location)} | ${cell(s.talent)} | ${s.durationSec} |`,
    ),
    "",
    "### Social captions",
    "",
    ...c.captions.flatMap((cap) => [
      `**${PLATFORM_LABELS[cap.platform]}** — ${cap.text}${cap.hashtags.length ? ` ${cap.hashtags.join(" ")}` : ""}`,
      "",
    ]),
  ];
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "campaign"
  );
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
