"use client";

import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { ApiError, fetchStatus, requestCampaign } from "@/lib/api-client";
import { editorReducer, type EditorAction } from "@/lib/editor";
import { downloadFile, projectToMarkdown, slugify } from "@/lib/export";
import { createId } from "@/lib/id";
import { toPhotoItem, toPhotoMeta, validatePhotoFiles, type PhotoItem } from "@/lib/photos";
import { BriefSchema, EMPTY_BRIEF, type Brief, type BriefInput, type Campaign, type Project } from "@/lib/schema";
import {
  deleteProject,
  getProjectsSnapshot,
  getServerProjectsSnapshot,
  parseProjectFile,
  saveProject,
  StorageError,
  subscribeProjects,
} from "@/lib/storage";
import { BriefForm } from "./brief/BriefForm";
import { Header } from "./Header";
import { ProjectsDrawer } from "./ProjectsDrawer";
import { Results, ResultsSkeleton } from "./results/Results";
import { Button, Icons, cx } from "./ui";

type Mode = "demo" | "live";
type Phase = "brief" | "loading" | "results";
type Meta = Omit<Campaign, "concepts">;

interface ErrorState {
  message: string;
  canFallBackToDemo: boolean;
}

const MODE_KEY = "acd.mode";
/** Short, deliberate pause in demo mode so the transition reads as "working". */
const DEMO_MIN_MS = 700;
const AUTOSAVE_MS = 600;

function defaultName(brief: BriefInput) {
  return brief.brandName?.trim() ? `${brief.brandName.trim()} campaign` : "Untitled campaign";
}

export function Studio() {
  const [phase, setPhase] = useState<Phase>("brief");
  const [brief, setBrief] = useState<BriefInput>(EMPTY_BRIEF);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const urlCache = useRef(new Map<string, string>());

  const [mode, setMode] = useState<Mode>("demo");
  const [status, setStatus] = useState({ liveAvailable: false, model: "" });

  const [concepts, rawDispatch] = useReducer(editorReducer, []);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [briefUsed, setBriefUsed] = useState<Brief | null>(null);
  const [selectedId, setSelectedId] = useState("");

  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [saveStatus, setSaveStatus] = useState("");

  const projects = useSyncExternalStore(subscribeProjects, getProjectsSnapshot, getServerProjectsSnapshot);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [error, setError] = useState<ErrorState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasCampaign = concepts.length > 0 && meta !== null && briefUsed !== null;
  const touch = useCallback(() => setRevision((r) => r + 1), []);

  const dispatch = useCallback(
    (action: EditorAction) => {
      rawDispatch(action);
      if (action.type !== "reset") touch();
    },
    [touch],
  );

  /* --------------------------- bootstrap ----------------------------- */
  useEffect(() => {
    let saved: Mode | null = null;
    try {
      saved = window.localStorage.getItem(MODE_KEY) as Mode | null;
    } catch {
      /* storage unavailable */
    }
    fetchStatus().then((s) => {
      setStatus(s);
      if (saved === "live" && s.liveAvailable) setMode("live");
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  function changeMode(m: Mode) {
    setMode(m);
    try {
      window.localStorage.setItem(MODE_KEY, m);
    } catch {
      /* ignore */
    }
  }

  /* ---------------------------- project -------------------------------- */
  const buildProject = useCallback((): Project | null => {
    if (!meta || !briefUsed || !projectId) return null;
    const now = new Date().toISOString();
    return {
      id: projectId,
      name: projectName.trim() || defaultName(briefUsed),
      brief: briefUsed,
      photos: photos.map(toPhotoMeta),
      campaign: {
        ...meta,
        concepts: concepts.map((c) => ({
          ...c,
          captions: c.captions.map((cap) => ({ ...cap, hashtags: cap.hashtags.filter(Boolean) })),
        })),
      },
      selectedConceptId: selectedId,
      createdAt: createdAt ?? now,
      updatedAt: now,
    };
  }, [meta, briefUsed, projectId, projectName, photos, concepts, selectedId, createdAt]);

  const persist = useCallback(
    (announce: boolean) => {
      const project = buildProject();
      if (!project) return;
      try {
        saveProject(project);
        if (!createdAt) setCreatedAt(project.createdAt);
        setSaveStatus("Saved in this browser");
        if (announce) setToast("Saved");
      } catch (err) {
        setSaveStatus("Not saved");
        setError({
          message: err instanceof StorageError ? err.message : "Could not save the project.",
          canFallBackToDemo: false,
        });
      }
    },
    [buildProject, createdAt],
  );

  // Autosave shortly after any change to the campaign.
  useEffect(() => {
    if (!hasCampaign || revision === 0) return;
    const t = setTimeout(() => persist(false), AUTOSAVE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `revision` is the change signal
  }, [revision, hasCampaign]);

  /* ---------------------------- photos -------------------------------- */
  function addPhotos(files: File[]): string[] {
    const { accepted, errors } = validatePhotoFiles(files, photos.length);
    const items = accepted.map((f) => toPhotoItem(f));
    for (const p of items) if (p.url) urlCache.current.set(p.id, p.url);
    if (items.length) {
      setPhotos((prev) => [...prev, ...items]);
      if (hasCampaign) touch();
    }
    return errors;
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (hasCampaign) touch();
  }

  /* --------------------------- generation ----------------------------- */
  async function generate(useMode: Mode = mode) {
    const parsed = BriefSchema.safeParse(brief);
    if (!parsed.success) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const previous: Phase = hasCampaign ? "results" : "brief";
    setPhase("loading");
    setError(null);
    window.scrollTo({ top: 0 });

    try {
      const started = Date.now();
      const campaign = await requestCampaign(brief, useMode, photos.length, controller.signal);
      if (useMode === "demo") await new Promise((r) => setTimeout(r, Math.max(0, DEMO_MIN_MS - (Date.now() - started))));
      if (controller.signal.aborted) return;

      const { concepts: next, ...rest } = campaign;
      rawDispatch({ type: "reset", concepts: next });
      setMeta(rest);
      setBriefUsed(parsed.data);
      setSelectedId(next[0]?.id ?? "");
      if (!projectId) {
        setProjectId(createId("project"));
        setCreatedAt(null);
      }
      if (!projectName) setProjectName(defaultName(brief));
      setPhase("results");
      touch();
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      const e = err instanceof ApiError ? err : new ApiError("UPSTREAM_ERROR", "Something went wrong. Please try again.");
      setError({ message: e.message, canFallBackToDemo: useMode === "live" });
      setPhase(previous === "results" ? "results" : "brief");
    }
  }

  /* ---------------------------- projects ------------------------------ */
  function openProject(p: Project) {
    abortRef.current?.abort();
    const { concepts: cs, ...rest } = p.campaign;
    rawDispatch({ type: "reset", concepts: cs });
    setMeta(rest);
    setBrief(p.brief);
    setBriefUsed(p.brief);
    setPhotos(p.photos.map((m) => ({ ...m, url: urlCache.current.get(m.id) })));
    setSelectedId(p.selectedConceptId ?? cs[0]?.id ?? "");
    setProjectId(p.id);
    setProjectName(p.name);
    setCreatedAt(p.createdAt);
    setRevision(0);
    setSaveStatus("Saved in this browser");
    setError(null);
    setDrawerOpen(false);
    setPhase("results");
    window.scrollTo({ top: 0 });
  }

  function newCampaign() {
    abortRef.current?.abort();
    rawDispatch({ type: "reset", concepts: [] });
    setMeta(null);
    setBriefUsed(null);
    setSelectedId("");
    setProjectId(null);
    setProjectName("");
    setCreatedAt(null);
    setRevision(0);
    setSaveStatus("");
    setBrief(EMPTY_BRIEF);
    setPhotos([]);
    setError(null);
    setPhase("brief");
    window.scrollTo({ top: 0 });
  }

  function remove(id: string) {
    deleteProject(id);
    if (id === projectId) setSaveStatus("Deleted from this browser");
  }

  async function importFile(file: File) {
    try {
      const p = parseProjectFile(await file.text());
      saveProject({ ...p, updatedAt: new Date().toISOString() });
      openProject(p);
      setToast("Project imported");
    } catch (err) {
      setError({
        message: err instanceof StorageError ? err.message : "Could not import that file.",
        canFallBackToDemo: false,
      });
    }
  }

  function exportAs(kind: "md" | "json") {
    const p = buildProject();
    if (!p) return;
    const base = slugify(p.name);
    if (kind === "md") downloadFile(`${base}.md`, projectToMarkdown(p), "text/markdown;charset=utf-8");
    else downloadFile(`${base}.json`, JSON.stringify(p, null, 2), "application/json");
    setToast(kind === "md" ? "Campaign exported" : "Project file downloaded");
  }

  /* ----------------------------- render -------------------------------- */
  return (
    <div className="relative">
      <Header
        mode={mode}
        onModeChange={changeMode}
        liveAvailable={status.liveAvailable}
        model={status.model}
        projectCount={projects.length}
        onOpenProjects={() => setDrawerOpen(true)}
        onNew={newCampaign}
      />

      <main className="min-h-[calc(100vh-3.5rem)]">
        {error && (
          <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
            <div role="alert" className="flex flex-wrap items-start gap-3 rounded-xl border border-signal/40 bg-signal/10 p-3.5 text-sm text-bone">
              <Icons.Alert className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
              <p className="min-w-0 flex-1">{error.message}</p>
              <div className="flex gap-2">
                {error.canFallBackToDemo && (
                  <Button
                    size="sm"
                    onClick={() => {
                      changeMode("demo");
                      generate("demo");
                    }}
                  >
                    Use demo mode
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setError(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {phase === "brief" && (
          <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
            <h1 className="font-display text-4xl uppercase leading-none sm:text-5xl">
              {hasCampaign ? "Edit brief" : "Create a campaign"}
            </h1>
            <p className="mb-8 mt-3 text-[15px] leading-relaxed text-bone/70">
              {hasCampaign
                ? "Update anything and create the campaign again."
                : "Describe your brand and product. You'll get three campaign ideas and a storyboard you can edit and export."}
            </p>
            <BriefForm
              value={brief}
              onChange={setBrief}
              photos={photos}
              onAddPhotos={addPhotos}
              onRemovePhoto={removePhoto}
              onSubmit={() => generate()}
              onCancel={hasCampaign ? () => setPhase("results") : undefined}
              loading={false}
              submitLabel={hasCampaign ? "Update Campaign" : "Create Campaign"}
            />
            {mode === "demo" && (
              <p className="mt-6 text-center text-xs text-mute">
                Demo mode: no API key needed. Ideas come from rule-based logic, not AI analysis.
              </p>
            )}
          </div>
        )}

        {phase === "loading" && <ResultsSkeleton brand={brief.brandName} />}

        {phase === "results" && hasCampaign && (
          <Results
            brief={briefUsed}
            meta={meta}
            concepts={concepts}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              touch();
            }}
            dispatch={dispatch}
            photos={photos}
            projectName={projectName}
            onProjectName={(n) => {
              setProjectName(n);
              touch();
            }}
            saveStatus={saveStatus}
            onExport={() => exportAs("md")}
            onExportJson={() => exportAs("json")}
            onSave={() => persist(true)}
            onEditBrief={() => {
              setPhase("brief");
              window.scrollTo({ top: 0 });
            }}
            onRegenerate={() => generate()}
            onNew={newCampaign}
          />
        )}
      </main>

      <ProjectsDrawer
        open={drawerOpen}
        projects={projects}
        currentId={projectId ?? undefined}
        onClose={() => setDrawerOpen(false)}
        onOpenProject={openProject}
        onDelete={remove}
        onImport={importFile}
      />

      <div
        aria-live="polite"
        className={cx(
          "fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 transition-all",
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        {toast && (
          <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-bone px-4 py-2 text-sm text-ink shadow-2xl">
            <Icons.Check className="h-4 w-4 text-signal" /> {toast}
          </div>
        )}
      </div>
    </div>
  );
}
