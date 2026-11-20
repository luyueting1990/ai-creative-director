import { z } from "zod";
import { ProjectSchema, type Project } from "./schema";

/**
 * Project persistence in the browser's localStorage.
 *
 * Every read is validated, so a corrupted or outdated entry is skipped rather
 * than crashing the app. The `StorageLike` parameter keeps this testable and
 * makes swapping in a server-backed store straightforward.
 */

export const STORAGE_KEY = "acd.projects.v1";
export const MAX_PROJECTS = 50;

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

function getStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

export function listProjects(storage: StorageLike | null = getStorage()): Project[] {
  if (!storage) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
  const arr = z.array(z.unknown()).safeParse(raw);
  if (!arr.success) return [];
  return arr.data
    .flatMap((item) => {
      const p = ProjectSchema.safeParse(item);
      return p.success ? [p.data] : [];
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

const CHANGE_EVENT = "acd:projects-changed";

function writeAll(projects: Project[], storage: StorageLike) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    throw new StorageError("Browser storage is full or unavailable — export the project instead.");
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

/* ---- useSyncExternalStore bindings (keeps React in sync across tabs) ---- */

const EMPTY: Project[] = [];
let snapshot: { raw: string | null; list: Project[] } = { raw: null, list: EMPTY };

export function subscribeProjects(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function getProjectsSnapshot(): Project[] {
  const storage = getStorage();
  let raw: string | null = null;
  try {
    raw = storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return EMPTY;
  }
  if (raw !== snapshot.raw) snapshot = { raw, list: raw ? listProjects(storage) : EMPTY };
  return snapshot.list;
}

export function getServerProjectsSnapshot(): Project[] {
  return EMPTY;
}

export function saveProject(project: Project, storage: StorageLike | null = getStorage()): Project {
  if (!storage) throw new StorageError("Browser storage is unavailable.");
  const valid = ProjectSchema.parse(project);
  const others = listProjects(storage).filter((p) => p.id !== valid.id);
  writeAll([valid, ...others].slice(0, MAX_PROJECTS), storage);
  return valid;
}

export function deleteProject(id: string, storage: StorageLike | null = getStorage()): void {
  if (!storage) return;
  writeAll(
    listProjects(storage).filter((p) => p.id !== id),
    storage,
  );
}

export function getProject(id: string, storage: StorageLike | null = getStorage()): Project | null {
  return listProjects(storage).find((p) => p.id === id) ?? null;
}

/** Parses a project previously exported as JSON (used by "Import"). */
export function parseProjectFile(text: string): Project {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new StorageError("That file isn't valid JSON.");
  }
  const result = ProjectSchema.safeParse(data);
  if (!result.success) throw new StorageError("That file isn't an AI Creative Director project.");
  return result.data;
}
