"use client";

import type { ReactNode } from "react";
import type { GenerationSource } from "@/lib/schema";
import { Button, Icons } from "../ui";
import { SectionHeading } from "./shared";

interface Props {
  dirty: boolean;
  savedAt: string | null;
  source: GenerationSource;
  photoCount: number;
  onSave: () => void;
  onExport: (kind: "md" | "json") => void;
  onOpenProjects: () => void;
  onEditBrief: () => void;
}

function Card({ title, body, children, accent }: { title: string; body: string; children: ReactNode; accent?: boolean }) {
  return (
    <div className={`flex flex-col rounded-2xl p-6 ${accent ? "bg-signal text-ink" : "border border-bone/10 bg-char"}`}>
      <p className="font-display text-3xl uppercase">{title}</p>
      <p className={`mt-2 flex-1 text-sm leading-relaxed ${accent ? "text-ink/75" : "text-mute"}`}>{body}</p>
      <div className="mt-6 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function ExportSection({ dirty, savedAt, source, photoCount, onSave, onExport, onOpenProjects, onEditBrief }: Props) {
  return (
    <div>
      <SectionHeading index="06" kicker="Deliver" title="Save & export" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          accent
          title="Save project"
          body={
            dirty
              ? "You have unsaved changes. Projects are saved in this browser, so you can reopen them from Projects."
              : savedAt
                ? `Saved ${new Date(savedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`
                : "Save to this browser and reopen any time from Projects."
          }
        >
          <Button variant="primary" onClick={onSave} className="!bg-ink !text-bone hover:!bg-ink/85">
            <Icons.Save /> {dirty ? "Save project" : "Save again"}
          </Button>
          <Button variant="ghost" onClick={onOpenProjects} className="!text-ink hover:!bg-ink/10">
            <Icons.Folder /> Projects
          </Button>
        </Card>
        <Card title="Treatment" body="A Markdown document with the brief, overview, all three concepts, storyboards, shot lists, hooks and captions. Paste it into Notion, Google Docs or a deck.">
          <Button onClick={() => onExport("md")}>
            <Icons.Download /> Download .md
          </Button>
        </Card>
        <Card title="Project file" body="A JSON file you can back up, share and import again from Projects → Import. It includes links and photo file names, but not the photos themselves.">
          <Button onClick={() => onExport("json")}>
            <Icons.Download /> Download .json
          </Button>
        </Card>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-bone/10 p-6" aria-labelledby="limits">
          <h3 id="limits" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-acid">
            <Icons.Info className="h-4 w-4" /> Demo limitations
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-bone/80">
            {source === "demo" && (
              <li>
                <strong className="text-bone">Illustrative content.</strong> Concepts come from a rule-based demo engine that
                matches keywords in your brief to creative templates. No AI model is called.
              </li>
            )}
            <li>
              <strong className="text-bone">Photos aren&apos;t analysed or uploaded.</strong> They&apos;re shown as visual references
              from your browser&apos;s memory and disappear after a refresh. Only file names are saved
              {photoCount ? ` (${photoCount} attached)` : ""}. Re-attach them by editing the brief.
            </li>
            <li>
              <strong className="text-bone">Links aren&apos;t opened.</strong> Instagram, TikTok, website and video links are saved
              and displayed for your team. They don&apos;t influence the demo output.
            </li>
            <li>
              <strong className="text-bone">Browser storage.</strong> Projects live in this browser&apos;s localStorage (up to 50).
              Clearing site data removes them, so export JSON for anything you want to keep.
            </li>
          </ul>
          <Button variant="ghost" size="sm" className="mt-4" onClick={onEditBrief}>
            <Icons.Edit /> Edit brief & photos
          </Button>
        </section>

        <section className="rounded-2xl border border-bone/10 p-6" aria-labelledby="next">
          <h3 id="next" className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">Path to real AI</h3>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-bone/80">
            <li>
              <span className="font-mono text-signal">01</span> Set <code className="rounded bg-char-2 px-1">ANTHROPIC_API_KEY</code> on
              the server to unlock <strong className="text-bone">Live AI</strong>. The same schema and workspace are already wired
              to Claude with structured outputs.
            </li>
            <li>
              <span className="font-mono text-signal">02</span> Send product photos to a vision model so palettes and styling
              notes reflect the real product.
            </li>
            <li>
              <span className="font-mono text-signal">03</span> Fetch reference links server-side and summarise them as extra
              context in the prompt.
            </li>
            <li>
              <span className="font-mono text-signal">04</span> Move projects and photos to cloud storage with accounts and
              shareable links.
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
