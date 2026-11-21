import { beforeEach, describe, expect, it } from "vitest";
import { generateDemoCampaign } from "./demo";
import type { Project } from "./schema";
import {
  MAX_PROJECTS,
  STORAGE_KEY,
  StorageError,
  deleteProject,
  getProject,
  listProjects,
  parseProjectFile,
  saveProject,
  type StorageLike,
} from "./storage";
import { brief } from "@/test/fixtures";

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
}

function project(id: string, updatedAt = "2026-01-01T00:00:00.000Z"): Project {
  return {
    id,
    name: `Project ${id}`,
    brief,
    photos: [{ id: "photo_1", name: "look.jpg", size: 1200, type: "image/jpeg" }],
    campaign: generateDemoCampaign(brief),
    createdAt: updatedAt,
    updatedAt,
  };
}

describe("project storage", () => {
  let storage: ReturnType<typeof memoryStorage>;
  beforeEach(() => {
    storage = memoryStorage();
  });

  it("saves, lists (newest first), gets and deletes", () => {
    saveProject(project("a", "2026-01-01T00:00:00.000Z"), storage);
    saveProject(project("b", "2026-02-01T00:00:00.000Z"), storage);
    expect(listProjects(storage).map((p) => p.id)).toEqual(["b", "a"]);
    expect(getProject("a", storage)?.name).toBe("Project a");

    deleteProject("b", storage);
    expect(listProjects(storage).map((p) => p.id)).toEqual(["a"]);
  });

  it("overwrites an existing project with the same id", () => {
    saveProject(project("a"), storage);
    saveProject({ ...project("a"), name: "Renamed" }, storage);
    expect(listProjects(storage)).toHaveLength(1);
    expect(listProjects(storage)[0].name).toBe("Renamed");
  });

  it("caps the number of stored projects", () => {
    for (let i = 0; i < MAX_PROJECTS + 3; i++) saveProject(project(`p${i}`), storage);
    expect(listProjects(storage)).toHaveLength(MAX_PROJECTS);
  });

  it("survives corrupted storage and skips invalid entries", () => {
    storage.setItem(STORAGE_KEY, "{not json");
    expect(listProjects(storage)).toEqual([]);

    storage.setItem(STORAGE_KEY, JSON.stringify([{ id: "broken" }, project("ok")]));
    expect(listProjects(storage).map((p) => p.id)).toEqual(["ok"]);
  });

  it("throws a friendly error when storage is full", () => {
    const full: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("quota", "QuotaExceededError");
      },
    };
    expect(() => saveProject(project("a"), full)).toThrow(StorageError);
  });

  it("returns nothing when storage is unavailable", () => {
    expect(listProjects(null)).toEqual([]);
    expect(() => saveProject(project("a"), null)).toThrow(StorageError);
  });
});

describe("parseProjectFile", () => {
  it("fills defaults for projects saved before photos existed", () => {
    const { photos: _photos, ...legacy } = project("old");
    void _photos;
    expect(parseProjectFile(JSON.stringify(legacy)).photos).toEqual([]);
  });

  it("round-trips an exported project", () => {
    const p = project("x");
    expect(parseProjectFile(JSON.stringify(p))).toEqual(p);
  });

  it("rejects non-JSON and foreign JSON", () => {
    expect(() => parseProjectFile("nope")).toThrow(/valid JSON/);
    expect(() => parseProjectFile('{"hello":1}')).toThrow(/isn't an AI Creative Director project/);
  });
});
