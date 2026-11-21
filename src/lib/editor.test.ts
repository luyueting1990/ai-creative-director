import { describe, expect, it } from "vitest";
import { generateDemoCampaign } from "./demo";
import { editorReducer, totalDuration } from "./editor";
import { brief, sequentialIds } from "@/test/fixtures";

const initial = generateDemoCampaign(brief, { idFactory: sequentialIds() }).concepts;
const c = initial[0];

describe("editorReducer", () => {
  it("updates concept fields immutably", () => {
    const next = editorReducer(initial, { type: "updateConcept", conceptId: c.id, patch: { title: "New" } });
    expect(next[0].title).toBe("New");
    expect(initial[0].title).not.toBe("New");
    expect(next[1]).toBe(initial[1]);
  });

  it("updates a single shot, including its image choice", () => {
    const s = c.shots[1];
    const next = editorReducer(initial, { type: "updateItem", conceptId: c.id, list: "shots", itemId: s.id, patch: { description: "Changed", photoId: "p1" } });
    expect(next[0].shots[1]).toMatchObject({ description: "Changed", photoId: "p1" });
    expect(next[0].shots[0]).toBe(c.shots[0]);
  });

  it("adds a shot with a known id so it can be edited straight away", () => {
    const next = editorReducer(initial, { type: "addItem", conceptId: c.id, list: "shots", id: "shot_new" });
    expect(next[0].shots.at(-1)).toMatchObject({ id: "shot_new", title: "New shot", durationSec: 3 });
  });

  it("adds hooks and captions for a platform", () => {
    const hooks = editorReducer(initial, { type: "addItem", conceptId: c.id, list: "hooks", platform: "tiktok" });
    expect(hooks[0].hooks.at(-1)).toMatchObject({ platform: "tiktok", text: "" });
    const caps = editorReducer(initial, { type: "addItem", conceptId: c.id, list: "captions", platform: "youtube" });
    expect(caps[0].captions.at(-1)?.platform).toBe("youtube");
  });

  it("removes and moves items, ignoring out-of-bounds moves", () => {
    const [a, b] = c.shots;
    const removed = editorReducer(initial, { type: "removeItem", conceptId: c.id, list: "shots", itemId: a.id });
    expect(removed[0].shots[0].id).toBe(b.id);

    const moved = editorReducer(initial, { type: "moveItem", conceptId: c.id, list: "shots", itemId: a.id, direction: 1 });
    expect(moved[0].shots.slice(0, 2).map((s) => s.id)).toEqual([b.id, a.id]);
    expect(editorReducer(initial, { type: "moveItem", conceptId: c.id, list: "shots", itemId: a.id, direction: -1 })[0]).toBe(initial[0]);
  });

  it("resets", () => {
    expect(editorReducer(initial, { type: "reset", concepts: [] })).toEqual([]);
  });
});

describe("totalDuration", () => {
  it("sums durations to one decimal place", () => {
    expect(totalDuration([{ durationSec: 1.15 }, { durationSec: 2 }])).toBe(3.2);
  });
});
