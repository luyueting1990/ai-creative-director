import { createId } from "./id";
import type { Caption, Concept, Frame, Hook, Platform, Shot } from "./schema";

/**
 * Pure reducer for editing a set of concepts. Keeping edits here (instead of
 * scattered setState calls) makes every editing behaviour unit-testable.
 */

export type ListKey = "storyboard" | "shotList" | "hooks" | "captions";
type ItemOf<K extends ListKey> = K extends "storyboard"
  ? Frame
  : K extends "shotList"
    ? Shot
    : K extends "hooks"
      ? Hook
      : Caption;

export type EditorAction =
  | { type: "reset"; concepts: Concept[] }
  | {
      type: "updateConcept";
      conceptId: string;
      patch: Partial<Omit<Concept, "id" | "storyboard" | "shotList" | "hooks" | "captions">>;
    }
  | { type: "updateItem"; conceptId: string; list: ListKey; itemId: string; patch: Record<string, unknown> }
  | { type: "addItem"; conceptId: string; list: ListKey; afterId?: string; platform?: Platform }
  | { type: "removeItem"; conceptId: string; list: ListKey; itemId: string }
  | { type: "moveItem"; conceptId: string; list: ListKey; itemId: string; direction: -1 | 1 };

export function blankItem<K extends ListKey>(list: K, platform: Platform = "instagram"): ItemOf<K> {
  switch (list) {
    case "storyboard":
      return {
        id: createId("frame"),
        title: "New frame",
        visual: "",
        audio: "",
        onScreenText: "",
        durationSec: 3,
        featuresProduct: false,
      } as ItemOf<K>;
    case "shotList":
      return {
        id: createId("shot"),
        shotType: "Medium",
        description: "",
        camera: "",
        movement: "",
        lighting: "",
        location: "",
        talent: "",
        direction: "",
        durationSec: 3,
      } as ItemOf<K>;
    case "hooks":
      return { id: createId("hook"), platform, text: "" } as ItemOf<K>;
    default:
      return { id: createId("caption"), platform, text: "", hashtags: [] } as unknown as ItemOf<K>;
  }
}

function mapConcept(concepts: Concept[], id: string, fn: (c: Concept) => Concept): Concept[] {
  return concepts.map((c) => (c.id === id ? fn(c) : c));
}

export function editorReducer(state: Concept[], action: EditorAction): Concept[] {
  switch (action.type) {
    case "reset":
      return action.concepts;

    case "updateConcept":
      return mapConcept(state, action.conceptId, (c) => ({ ...c, ...action.patch }));

    case "updateItem":
      return mapConcept(state, action.conceptId, (c) => ({
        ...c,
        [action.list]: (c[action.list] as { id: string }[]).map((item) =>
          item.id === action.itemId ? { ...item, ...action.patch } : item,
        ),
      }));

    case "addItem":
      return mapConcept(state, action.conceptId, (c) => {
        const list = [...(c[action.list] as { id: string }[])];
        const item = blankItem(action.list, action.platform);
        const idx = action.afterId ? list.findIndex((i) => i.id === action.afterId) : -1;
        if (idx >= 0) list.splice(idx + 1, 0, item);
        else list.push(item);
        return { ...c, [action.list]: list };
      });

    case "removeItem":
      return mapConcept(state, action.conceptId, (c) => ({
        ...c,
        [action.list]: (c[action.list] as { id: string }[]).filter((i) => i.id !== action.itemId),
      }));

    case "moveItem":
      return mapConcept(state, action.conceptId, (c) => {
        const list = [...(c[action.list] as { id: string }[])];
        const from = list.findIndex((i) => i.id === action.itemId);
        const to = from + action.direction;
        if (from < 0 || to < 0 || to >= list.length) return c;
        [list[from], list[to]] = [list[to], list[from]];
        return { ...c, [action.list]: list };
      });

    default:
      return state;
  }
}

export function totalDuration(items: { durationSec: number }[]): number {
  return Math.round(items.reduce((sum, i) => sum + (Number(i.durationSec) || 0), 0) * 10) / 10;
}
