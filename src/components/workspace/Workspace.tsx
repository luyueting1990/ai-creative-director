"use client";

import { useEffect, useRef, type Dispatch } from "react";
import type { EditorAction } from "@/lib/editor";
import type { PhotoItem } from "@/lib/photos";
import { campaignDuration, campaignPlatforms, type Brief, type Campaign, type Concept } from "@/lib/schema";
import { Button, DemoBadge, EditableText, Icons, cx } from "../ui";
import { ConceptsSection } from "./ConceptsSection";
import { ExportSection } from "./ExportSection";
import { OverviewSection } from "./OverviewSection";
import { ProductionSection } from "./ProductionSection";
import { SocialSection } from "./SocialSection";
import { StoryboardSection } from "./StoryboardSection";

export const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "concepts", label: "Concepts" },
  { id: "storyboard", label: "Storyboard" },
  { id: "production", label: "Production" },
  { id: "social", label: "Social" },
  { id: "export", label: "Export" },
] as const;
export type SectionId = (typeof SECTIONS)[number]["id"];

interface Props {
  brief: Brief;
  meta: Omit<Campaign, "concepts">;
  concepts: Concept[];
  selectedId: string;
  onSelect: (id: string) => void;
  dispatch: Dispatch<EditorAction>;
  photos: PhotoItem[];
  section: SectionId;
  onSection: (s: SectionId) => void;
  projectName: string;
  onProjectName: (name: string) => void;
  dirty: boolean;
  savedAt: string | null;
  onSave: () => void;
  onExport: (kind: "md" | "json") => void;
  onEditBrief: () => void;
  onRegenerate: () => void;
  onOpenProjects: () => void;
}

export function Workspace(props: Props) {
  const { brief, meta, concepts, selectedId, onSelect, dispatch, photos, section, onSection } = props;
  const concept = concepts.find((c) => c.id === selectedId) ?? concepts[0];
  const topRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const activeIndex = SECTIONS.findIndex((s) => s.id === section);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [section]);

  const go = (s: SectionId) => () => onSection(s);
  const common = { concepts, concept, onSelect, dispatch };

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-8">
      {/* Project bar */}
      <div className="flex flex-col gap-5 pt-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
            {meta.source === "demo" ? (
              <DemoBadge />
            ) : (
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-emerald-300">Claude · {meta.model}</span>
            )}
            <span aria-live="polite">{props.dirty ? "● Unsaved changes" : props.savedAt ? "Saved" : ""}</span>
          </div>
          <EditableText
            label="Project name"
            value={props.projectName}
            onChange={(v) => props.onProjectName(v.replace(/\n/g, " "))}
            className="font-display text-3xl uppercase leading-none sm:text-4xl"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="signal" onClick={props.onSave}>
            <Icons.Save /> Save
          </Button>
          <Button onClick={props.onEditBrief}>
            <Icons.Edit /> Edit brief
          </Button>
          <Button onClick={props.onRegenerate}>
            <Icons.Refresh /> Regenerate
          </Button>
          <Button onClick={go("export")}>
            <Icons.Download /> Export
          </Button>
        </div>
      </div>

      {meta.source === "demo" && (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-acid/25 bg-acid/[0.05] px-4 py-3 text-xs leading-relaxed text-bone/75">
          <Icons.Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-acid" />
          <span>
            <strong className="text-bone">Illustrative demo content.</strong> Generated from the text of your brief by a
            rule-based engine. Photos, websites and videos are shown as references only and have not been analysed by AI.
          </span>
        </p>
      )}

      {/* Section nav */}
      <div ref={topRef} className="scroll-mt-16" />
      <nav
        aria-label="Campaign sections"
        className="sticky top-16 z-30 -mx-4 mt-6 border-y border-bone/10 bg-ink/85 px-4 backdrop-blur-xl sm:-mx-8 sm:px-8"
      >
        <ol className="no-scrollbar flex gap-1 overflow-x-auto py-2">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={go(s.id)}
                aria-current={section === s.id ? "step" : undefined}
                className={cx(
                  "flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition",
                  section === s.id
                    ? "bg-bone text-ink"
                    : i < activeIndex
                      ? "text-bone/80 hover:bg-bone/5"
                      : "text-bone/50 hover:bg-bone/5 hover:text-bone",
                )}
              >
                <span className={cx("font-mono text-[10px]", section === s.id ? "text-signal" : "opacity-60")}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div key={section} className="animate-fade-up pt-12">
        {section === "overview" && (
          <OverviewSection
            brief={brief}
            overview={meta.overview}
            photos={photos}
            source={meta.source}
            onNext={go("concepts")}
            onEditBrief={props.onEditBrief}
          />
        )}
        {section === "concepts" && (
          <ConceptsSection
            concepts={concepts}
            selectedId={concept.id}
            onSelect={onSelect}
            dispatch={dispatch}
            photos={photos}
            onNext={go("storyboard")}
          />
        )}
        {section === "storyboard" && (
          <StoryboardSection {...common} photos={photos} targetSec={campaignDuration(brief)} onNext={go("production")} />
        )}
        {section === "production" && <ProductionSection {...common} onNext={go("social")} />}
        {section === "social" && (
          <SocialSection
            {...common}
            platforms={campaignPlatforms(brief)}
            photos={photos}
            brandName={brief.brandName}
            onNext={go("export")}
          />
        )}
        {section === "export" && (
          <ExportSection
            dirty={props.dirty}
            savedAt={props.savedAt}
            source={meta.source}
            photoCount={photos.length}
            onSave={props.onSave}
            onExport={props.onExport}
            onOpenProjects={props.onOpenProjects}
            onEditBrief={props.onEditBrief}
          />
        )}
      </div>
    </div>
  );
}
