import type { Brief } from "@/lib/schema";

export const brief: Brief = {
  brandName: "Maison Verre",
  collection: "Salt Light linen",
  audience: "Design-literate city dwellers 28–45",
  goal: "Drive pre-orders for the launch",
  tone: "Calm, poetic, understated",
  platforms: ["instagram", "tiktok"],
  notes: "",
};

export function sequentialIds() {
  let n = 0;
  return (prefix: string) => `${prefix}_${++n}`;
}
