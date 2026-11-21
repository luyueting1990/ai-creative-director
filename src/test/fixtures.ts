import type { Brief } from "@/lib/schema";

export const brief: Brief = {
  brandName: "Atelier Noor",
  brandDescription:
    "A small-batch label making handmade knitwear from recycled wool, with a playful, colourful point of view.",
  productDescription: "The Winter Bloom capsule: six oversized cardigans in hand-dyed merino.",
  goal: "Launch the capsule and drive pre-orders.",
  links: ["https://instagram.com/ateliernoor", "https://ateliernoor.com/winter-bloom"],
  platforms: [],
  audience: "",
  durationSec: undefined,
};

export function sequentialIds() {
  let n = 0;
  return (prefix: string) => `${prefix}_${++n}`;
}
