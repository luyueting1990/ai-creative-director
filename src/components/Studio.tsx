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
import { Hero } from "./brief/Hero";
import { GeneratingState } from "./GeneratingState";
import { Header } from "./Header";
import { ProjectsDrawer } from "./ProjectsDrawer";
import { Button, Icons, cx } from "./ui";
import { Workspace, type SectionId } from "./workspace/Workspace";

type Mode = "demo" | "live";
type Phase = "brief" | "loading" | "workspace";
type Meta = Omit<Campaign, "concepts">;

interface ErrorState {
  message: string;
  canFallBackToDemo: boolean;
}

const MODE_KEY = "acd.mode";
/** Minimum time the demo loader is shown, so the workflow reads as a step rather than a flicker. */
const DEMO_MIN_MS = 2000;

function defaultName(brief: BriefInput) {
  return brief.brandName?.trim() ? `${brief.brandName.trim()} — Campaign` : "Untitled campaign";
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
  const [selectedId, setSelectedId] = useState<string>("");
  const [section, setSection] = useState<SectionId>("overview");

  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const projects = useSyncExternalStore(subscribeProjects, getProjectsSnapshot, getServerProjectsSnapshot);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [error, setError] = useState<ErrorState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const hasCampaign = concepts.length > 0 && meta !== null && briefUsed !== null;

  const dispatch = useCallback((action: EditorAction) => {
    rawDispatch(action);
    if (action.type !== "reset") setDirty(true);
  }, []);

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
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function changeMode(m: Mode) {
    setMode(m);
    try {
      window.localStorage.setItem(MODE_KEY, m);
    } catch {
      /* ignore */
    }
  }

  /* ---------------------------- photos -------------------------------- */
  function addPhotos(files: File[]): string[] {
    const { accepted, errors } = validatePhotoFiles(files, photos.length);
    const items = accepted.map((f) => toPhotoItem(f));
    for (const p of items) if (p.url) urlCache.current.set(p.id, p.url);
    if (items.length) setPhotos((prev) => [...prev, ...items]);
    return errors;
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    const url = urlCache.current.get(id);
    // Keep URLs that a saved project still references in this session; revoke the rest.
    if (url && !projects.some((p) => p.photos.some((ph) => ph.id === id))) {
      URL.revokeObjectURL(url);
      urlCache.current.delete(id);
    }
    if (hasCampaign) setDirty(true);
  }

  /* --------------------------- generation ----------------------------- */
  async function generate(useMode: Mode = mode) {
    const parsed = BriefSchema.safeParse(brief);
    if (!parsed.success) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const returnTo: Phase = hasCampaign ? "workspace" : "brief";
    setPhase("loading");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });

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
      setSection("overview");
      if (!projectId || !projectName) setProjectName(defaultName(brief));
      setDirty(true);
      setPhase("workspace");
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      const e = err instanceof ApiError ? err : new ApiError("UPSTREAM_ERROR", "Something went wrong. Please try again.");
      setError({ message: e.message, canFallBackToDemo: useMode === "live" });
      setPhase(returnTo === "workspace" ? "workspace" : "brief");
    }
  }

  function cancelGeneration() {
    abortRef.current?.abort();
    setPhase(hasCampaign ? "workspace" : "brief");
  }

  /* ---------------------------- projects ------------------------------ */
  function buildProject(): Project | null {
    if (!meta || !briefUsed) return null;
    const now = new Date().toISOString();
    return {
      id: projectId ?? createId("project"),
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
  }

  function save() {
    const project = buildProject();
    if (!project) return;
    try {
      saveProject(project);
      setProjectId(project.id);
      setCreatedAt(project.createdAt);
      setSavedAt(project.updatedAt);
      setDirty(false);
      setToast(photos.length ? "Project saved · photo previews last until refresh" : "Project saved");
    } catch (err) {
      setError({
        message: err instanceof StorageError ? err.message : "Could not save the project.",
        canFallBackToDemo: false,
      });
    }
  }

  function openProject(p: Project) {
    if (dirty && !window.confirm("Discard unsaved changes to the current campaign?")) return;
    abortRef.current?.abort();
    const { concepts: cs, ...rest } = p.campaign;
    rawDispatch({ type: "reset", concepts: cs });
    setMeta(rest);
    setBrief(p.brief);
    setBriefUsed(p.brief);
    setPhotos(p.photos.map((m) => ({ ...m, url: urlCache.current.get(m.id) })));
    setSelectedId(p.selectedConceptId ?? cs[0]?.id ?? "");
    setSection("overview");
    setProjectId(p.id);
    setProjectName(p.name);
    setCreatedAt(p.createdAt);
    setSavedAt(p.updatedAt);
    setDirty(false);
    setError(null);
    setDrawerOpen(false);
    setPhase("workspace");
    window.scrollTo({ top: 0 });
  }

  function newCampaign() {
    if (dirty && !window.confirm("Discard unsaved changes and start a new campaign?")) return;
    abortRef.current?.abort();
    rawDispatch({ type: "reset", concepts: [] });
    setMeta(null);
    setBriefUsed(null);
    setSelectedId("");
    setProjectId(null);
    setProjectName("");
    setCreatedAt(null);
    setSavedAt(null);
    setBrief(EMPTY_BRIEF);
    setPhotos([]);
    setDirty(false);
    setError(null);
    setPhase("brief");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remove(id: string) {
    deleteProject(id);
    if (id === projectId) {
      setProjectId(null);
      setCreatedAt(null);
      setSavedAt(null);
      if (hasCampaign) setDirty(true);
    }
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
    setToast(kind === "md" ? "Treatment downloaded" : "Project file downloaded");
  }

  function editBrief() {
    setPhase("brief");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

      <main>
        {error && (
          <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-8">
            <div role="alert" className="flex flex-wrap items-start gap-3 rounded-2xl border border-signal/50 bg-signal/10 p-4 text-sm text-bone">
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
          <>
            {!hasCampaign && <Hero onStart={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />}
            <div ref={formRef} className="mx-auto max-w-[1440px] scroll-mt-16 px-4 pb-16 pt-14 sm:px-8">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-mute">
                    {hasCampaign ? "Edit & regenerate" : "Step 01 / Brief"}
                  </p>
                  <h2 className="mt-3 font-display text-[clamp(2.8rem,8vw,6rem)] uppercase leading-[0.85]">
                    The <span className="font-serif normal-case italic text-signal">brief</span>
                  </h2>
                </div>
                <p className="max-w-sm text-sm text-mute">
                  Required: brand name, brand description, product and goal. Everything else is optional but makes the
                  workspace richer.
                </p>
              </div>
              <BriefForm
                value={brief}
                onChange={setBrief}
                photos={photos}
                onAddPhotos={addPhotos}
                onRemovePhoto={removePhoto}
                onSubmit={() => generate()}
                onCancel={hasCampaign ? () => setPhase("workspace") : undefined}
                loading={false}
                mode={mode}
              />
            </div>
          </>
        )}

        {phase === "loading" && <GeneratingState mode={mode} brand={brief.brandName} onCancel={cancelGeneration} />}

        {phase === "workspace" && hasCampaign && (
          <Workspace
            brief={briefUsed}
            meta={meta}
            concepts={concepts}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setDirty(true);
            }}
            dispatch={dispatch}
            photos={photos}
            section={section}
            onSection={setSection}
            projectName={projectName}
            onProjectName={(n) => {
              setProjectName(n);
              setDirty(true);
            }}
            dirty={dirty}
            savedAt={savedAt}
            onSave={save}
            onExport={exportAs}
            onEditBrief={editBrief}
            onRegenerate={() => generate()}
            onOpenProjects={() => setDrawerOpen(true)}
          />
        )}
      </main>

      <footer className="border-t border-bone/10 px-4 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 text-xs text-mute sm:flex-row sm:justify-between">
          <span className="font-display text-base uppercase tracking-wide text-bone">AI Creative Director</span>
          <span>Demo content is illustrative. Built with Next.js, TypeScript & Tailwind CSS, ready for Claude.</span>
        </div>
      </footer>

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
          <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-bone px-4 py-2.5 text-sm text-ink shadow-2xl">
            <Icons.Check className="h-4 w-4 text-signal" /> {toast}
          </div>
        )}
      </div>
    </div>
  );
}
