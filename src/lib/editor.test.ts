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

  it("updates a single storyboard frame", () => {
    const f = c.storyboard[1];
    const next = editorReducer(initial, {
      type: "updateItem",
      conceptId: c.id,
      list: "storyboard",
      itemId: f.id,
      patch: { visual: "Changed" },
    });
    expect(next[0].storyboard[1].visual).toBe("Changed");
    expect(next[0].storyboard[0]).toBe(c.storyboard[0]);
  });

  it("inserts an item after a given id, or appends", () => {
    const after = editorReducer(initial, { type: "addItem", conceptId: c.id, list: "storyboard", afterId: c.storyboard[0].id });
    expect(after[0].storyboard).toHaveLength(c.storyboard.length + 1);
    expect(after[0].storyboard[1].title).toBe("New frame");

    const appended = editorReducer(initial, { type: "addItem", conceptId: c.id, list: "shotList" });
    expect(appended[0].shotList.at(-1)?.shotType).toBe("Medium");
  });

  it("adds and edits hooks", () => {
    const added = editorReducer(initial, { type: "addItem", conceptId: c.id, list: "hooks", platform: "tiktok" });
    const hook = added[0].hooks.at(-1)!;
    expect(hook).toMatchObject({ platform: "tiktok", text: "" });
    const edited = editorReducer(added, { type: "updateItem", conceptId: c.id, list: "hooks", itemId: hook.id, patch: { text: "POV" } });
    expect(edited[0].hooks.at(-1)?.text).toBe("POV");
  });

  it("toggles whether a frame features the product", () => {
    const f = c.storyboard[0];
    const next = editorReducer(initial, { type: "updateItem", conceptId: c.id, list: "storyboard", itemId: f.id, patch: { featuresProduct: !f.featuresProduct } });
    expect(next[0].storyboard[0].featuresProduct).toBe(!f.featuresProduct);
  });

  it("adds a caption for a specific platform", () => {
    const next = editorReducer(initial, { type: "addItem", conceptId: c.id, list: "captions", platform: "youtube" });
    expect(next[0].captions.at(-1)?.platform).toBe("youtube");
  });

  it("removes items", () => {
    const id = c.shotList[0].id;
    const next = editorReducer(initial, { type: "removeItem", conceptId: c.id, list: "shotList", itemId: id });
    expect(next[0].shotList.find((s) => s.id === id)).toBeUndefined();
  });

  it("moves items and ignores out-of-bounds moves", () => {
    const [a, b] = c.storyboard;
    const down = editorReducer(initial, { type: "moveItem", conceptId: c.id, list: "storyboard", itemId: a.id, direction: 1 });
    expect(down[0].storyboard.slice(0, 2).map((f) => f.id)).toEqual([b.id, a.id]);

    const up = editorReducer(initial, { type: "moveItem", conceptId: c.id, list: "storyboard", itemId: a.id, direction: -1 });
    expect(up[0]).toBe(initial[0]);
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
