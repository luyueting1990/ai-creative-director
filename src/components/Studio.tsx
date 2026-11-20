"use client";

import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { ApiError, fetchStatus, requestCampaign } from "@/lib/api-client";
import { editorReducer, type EditorAction } from "@/lib/editor";
import { downloadFile, projectToMarkdown, slugify } from "@/lib/export";
import { createId } from "@/lib/id";
import { EMPTY_BRIEF } from "@/lib/samples";
import { BriefSchema, PLATFORM_LABELS, type BriefInput, type Campaign, type Project } from "@/lib/schema";
import {
  deleteProject,
  getProjectsSnapshot,
  getServerProjectsSnapshot,
  parseProjectFile,
  saveProject,
  StorageError,
  subscribeProjects,
} from "@/lib/storage";
import { BriefForm } from "./BriefForm";
import { ConceptCards } from "./ConceptCards";
import { ConceptWorkspace } from "./ConceptWorkspace";
import { GeneratingState } from "./GeneratingState";
import { Header } from "./Header";
import { ProjectsDrawer } from "./ProjectsDrawer";
import { Button, EditableText, Icons, cx } from "./ui";

type Mode = "demo" | "live";
type Meta = Omit<Campaign, "concepts">;

interface ErrorState {
  message: string;
  canFallBackToDemo: boolean;
}

const MODE_KEY = "acd.mode";

function defaultName(brief: BriefInput) {
  return [brief.brandName, brief.collection].filter(Boolean).join(" — ") || "Untitled campaign";
}

export function Studio() {
  const [brief, setBrief] = useState<BriefInput>(EMPTY_BRIEF);
  const [mode, setMode] = useState<Mode>("demo");
  const [status, setStatus] = useState({ liveAvailable: false, model: "" });

  const [concepts, rawDispatch] = useReducer(editorReducer, []);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [briefUsed, setBriefUsed] = useState<BriefInput | null>(null);
  const [selectedId, setSelectedId] = useState<string>();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const projects = useSyncExternalStore(subscribeProjects, getProjectsSnapshot, getServerProjectsSnapshot);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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

  /* --------------------------- actions ------------------------------- */
  async function generate(useMode: Mode = mode) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setBriefOpen(false);

    try {
      const started = Date.now();
      const campaign = await requestCampaign(brief, useMode, controller.signal);
      // Give demo mode a brief, intentional "thinking" beat.
      if (useMode === "demo") await new Promise((r) => setTimeout(r, Math.max(0, 1100 - (Date.now() - started))));
      if (controller.signal.aborted) return;

      const { concepts: next, ...rest } = campaign;
      rawDispatch({ type: "reset", concepts: next });
      setMeta(rest);
      setBriefUsed(brief);
      setSelectedId(next[0]?.id);
      if (!projectId) {
        setProjectName(defaultName(brief));
      }
      setDirty(true);
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      const e = err instanceof ApiError ? err : new ApiError("UPSTREAM_ERROR", "Something went wrong.");
      setError({
        message: e.message,
        canFallBackToDemo: useMode === "live",
      });
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }

  function buildProject(): Project | null {
    if (!meta || !briefUsed) return null;
    const parsedBrief = BriefSchema.safeParse(briefUsed);
    if (!parsedBrief.success) return null;
    const now = new Date().toISOString();
    return {
      id: projectId ?? createId("project"),
      name: projectName.trim() || defaultName(briefUsed),
      brief: parsedBrief.data,
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
      setDirty(false);
      setToast("Project saved");
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
    setLoading(false);
    const { concepts: cs, ...rest } = p.campaign;
    rawDispatch({ type: "reset", concepts: cs });
    setMeta(rest);
    setBrief(p.brief);
    setBriefUsed(p.brief);
    setSelectedId(p.selectedConceptId ?? cs[0]?.id);
    setProjectId(p.id);
    setProjectName(p.name);
    setCreatedAt(p.createdAt);
    setDirty(false);
    setError(null);
    setDrawerOpen(false);
  }

  function newCampaign() {
    if (dirty && !window.confirm("Discard unsaved changes and start a new campaign?")) return;
    abortRef.current?.abort();
    setLoading(false);
    rawDispatch({ type: "reset", concepts: [] });
    setMeta(null);
    setBriefUsed(null);
    setSelectedId(undefined);
    setProjectId(null);
    setProjectName("");
    setCreatedAt(null);
    setBrief(EMPTY_BRIEF);
    setDirty(false);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remove(id: string) {
    deleteProject(id);
    if (id === projectId) {
      setProjectId(null);
      setCreatedAt(null);
      setDirty(true);
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
  }

  /* --------------------------- render -------------------------------- */
  const hasResults = concepts.length > 0 && meta;
  const selectedIndex = Math.max(0, concepts.findIndex((c) => c.id === selectedId));
  const selected = concepts[selectedIndex];

  return (
    <div className="relative z-10">
      <Header
        mode={mode}
        onModeChange={changeMode}
        liveAvailable={status.liveAvailable}
        model={status.model}
        projectCount={projects.length}
        onOpenProjects={() => setDrawerOpen(true)}
        onNew={newCampaign}
      />

      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        {/* Hero + brief */}
        {!hasResults && (
          <section className="grid gap-10 pt-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:pt-20">
            <div className="animate-fade-up">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
                <Icons.Sparkle className="h-3 w-3" /> Fashion campaign studio
              </p>
              <h1 className="font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                From brief to <em className="text-accent">campaign</em> in one sitting.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/70">
                Describe the brand and the moment. Your AI creative director returns three distinct concepts — each
                with a storyboard, a production-ready shot list and platform-native captions you can edit, save and
                export.
              </p>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
                {[
                  ["3", "Concepts"],
                  ["4", "Deliverables each"],
                  [String(Object.keys(PLATFORM_LABELS).length), "Platforms"],
                ].map(([n, l]) => (
                  <div key={l}>
                    <dt className="text-[10px] uppercase tracking-[0.2em] text-muted">{l}</dt>
                    <dd className="font-display text-3xl">{n}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="animate-fade-up rounded-3xl bg-paper/90 p-6 ring-1 ring-line shadow-[0_40px_100px_-60px_rgba(21,20,18,0.6)] [animation-delay:120ms] sm:p-8">
              <h2 className="mb-1 font-display text-2xl">The brief</h2>
              <p className="mb-6 text-sm text-muted">Tell us about the brand, the collection and the goal.</p>
              <BriefForm value={brief} onChange={setBrief} onSubmit={() => generate()} loading={loading} mode={mode} />
            </div>
          </section>
        )}

        {error && (
          <div
            role="alert"
            className="mt-8 flex flex-wrap items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-900"
          >
            <Icons.Alert className="mt-0.5 h-4 w-4 shrink-0" />
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
        )}

        {loading && (
          <div className="mt-12">
            <GeneratingState mode={mode} />
          </div>
        )}

        {/* Results */}
        {hasResults && !loading && (
          <div ref={resultsRef} className="scroll-mt-20 pt-8">
            <div className="mb-6 space-y-4">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted">
                  <span
                    className={cx(
                      "rounded-full px-2 py-0.5 font-medium",
                      meta.source === "claude" ? "bg-emerald-100 text-emerald-800" : "bg-accent-soft text-accent",
                    )}
                  >
                    {meta.source === "claude" ? `Claude · ${meta.model}` : "Demo output"}
                  </span>
                  <span>{dirty ? "Unsaved changes" : projectId ? "Saved" : ""}</span>
                </div>
                <EditableText
                  label="Project name"
                  value={projectName}
                  onChange={(v) => {
                    setProjectName(v.replace(/\n/g, " "));
                    setDirty(true);
                  }}
                  className="font-display text-3xl leading-tight tracking-tight sm:text-4xl"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={save}>
                  <Icons.Save /> Save
                </Button>
                <Button onClick={() => setBriefOpen((o) => !o)} aria-expanded={briefOpen}>
                  <Icons.Edit /> {briefOpen ? "Hide brief" : "Edit brief"}
                </Button>
                <Button onClick={() => generate()} disabled={loading}>
                  <Icons.Refresh /> Regenerate
                </Button>
                <Button onClick={() => exportAs("md")}>
                  <Icons.Download /> Markdown
                </Button>
                <Button onClick={() => exportAs("json")}>
                  <Icons.Download /> JSON
                </Button>
              </div>
            </div>

            {briefOpen && (
              <div className="mb-8 animate-fade-up rounded-3xl bg-paper p-6 ring-1 ring-line sm:p-8">
                <BriefForm value={brief} onChange={setBrief} onSubmit={() => generate()} loading={loading} mode={mode} />
              </div>
            )}

            <ConceptCards concepts={concepts} selectedId={selected?.id} onSelect={setSelectedId} />

            {selected && briefUsed && (
              <div className="mt-8">
                <ConceptWorkspace
                  key={selected.id}
                  concept={selected}
                  index={selectedIndex}
                  platforms={briefUsed.platforms}
                  dispatch={dispatch}
                />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-line py-8 text-center text-xs text-muted">
        AI Creative Director · Built with Next.js, Tailwind CSS and Claude
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
          "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all",
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        {toast && (
          <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm text-ivory shadow-xl">
            <Icons.Check className="h-4 w-4 text-emerald-400" /> {toast}
          </div>
        )}
      </div>
    </div>
  );
}
