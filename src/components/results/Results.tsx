"use client";

import { useState, type Dispatch } from "react";
import { createId } from "@/lib/id";
import type { EditorAction } from "@/lib/editor";
import type { PhotoItem } from "@/lib/photos";
import { campaignDuration, type Brief, type Campaign, type Concept } from "@/lib/schema";
import { Button, DemoBadge, EditableText, Icons } from "../ui";
import { ActionsMenu } from "./ActionsMenu";
import { ConceptPicker } from "./ConceptPicker";
import { MoreDetails } from "./MoreDetails";
import { ShotEditor } from "./ShotEditor";
import { Storyboard } from "./Storyboard";

interface Props {
  brief: Brief;
  meta: Omit<Campaign, "concepts">;
  concepts: Concept[];
  selectedId: string;
  onSelect: (id: string) => void;
  dispatch: Dispatch<EditorAction>;
  photos: PhotoItem[];
  projectName: string;
  onProjectName: (name: string) => void;
  saveStatus: string;
  onExport: () => void;
  onExportJson: () => void;
  onSave: () => void;
  onEditBrief: () => void;
  onRegenerate: () => void;
  onNew: () => void;
}

/** The single results page: concepts, storyboard and optional details. */
export function Results(props: Props) {
  const { brief, meta, concepts, selectedId, onSelect, dispatch, photos } = props;
  const concept = concepts.find((c) => c.id === selectedId) ?? concepts[0];
  const [editing, setEditing] = useState<string | null>(null);

  function addShot() {
    const id = createId("shot");
    dispatch({ type: "addItem", conceptId: concept.id, list: "shots", id });
    setEditing(id);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-20 pt-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <EditableText
            label="Project name"
            value={props.projectName}
            onChange={(v) => props.onProjectName(v.replace(/\n/g, " "))}
            className="font-display text-2xl uppercase leading-tight sm:text-3xl"
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-mute">
            {meta.source === "demo" ? <DemoBadge /> : <span>Generated with {meta.model}</span>}
            <span aria-live="polite">{props.saveStatus}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <ActionsMenu
            items={[
              { label: "Edit brief", icon: <Icons.Edit />, onSelect: props.onEditBrief },
              { label: "Save", icon: <Icons.Save />, onSelect: props.onSave },
              { label: "Regenerate", icon: <Icons.Refresh />, onSelect: props.onRegenerate },
              { label: "Download project file", icon: <Icons.Download />, onSelect: props.onExportJson },
              { label: "New campaign", icon: <Icons.Plus />, onSelect: props.onNew },
            ]}
          />
          <Button variant="signal" onClick={props.onExport} className="flex-1 sm:flex-none">
            <Icons.Download /> Export Campaign
          </Button>
        </div>
      </div>

      {meta.source === "demo" && (
        <p className="text-xs leading-relaxed text-mute">
          Demo mode: concepts are assembled by rule-based logic from the words in your brief. Photos and links are shown as references
          only and are not analysed.
        </p>
      )}

      <ConceptPicker concepts={concepts} selectedId={concept.id} onSelect={onSelect} photos={photos} />

      <div key={concept.id} className="animate-fade-up">
        <Storyboard concept={concept} photos={photos} targetSec={campaignDuration(brief)} onEdit={setEditing} onAdd={addShot} />
      </div>

      <MoreDetails concept={concept} brief={brief} read={meta.read} source={meta.source} photos={photos} dispatch={dispatch} />

      {editing && (
        <ShotEditor concept={concept} shotId={editing} photos={photos} dispatch={dispatch} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

export function ResultsSkeleton({ brand }: { brand: string }) {
  return (
    <div aria-busy="true" aria-live="polite" className="mx-auto max-w-6xl space-y-6 px-4 pt-6 sm:px-6">
      <p className="text-sm text-mute">Creating three concepts for {brand || "your brand"}…</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton aspect-[4/5] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
