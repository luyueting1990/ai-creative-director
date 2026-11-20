import type { BriefInput } from "./schema";

/** Fictional sample briefs so reviewers can try the app in one click. */
export const SAMPLE_BRIEFS: { label: string; brief: BriefInput }[] = [
  {
    label: "Maison Verre — SS27 linen",
    brief: {
      brandName: "Maison Verre",
      collection: "Spring/Summer '27 \"Salt Light\" linen collection",
      audience:
        "Design-literate women and men 28–45 in coastal cities who buy fewer, better pieces and care about provenance",
      goal: "Launch the collection and drive pre-orders while positioning the brand as the quiet-luxury leader in sustainable linen",
      tone: "Calm, sun-bleached, poetic, understated luxury",
      platforms: ["instagram", "tiktok", "pinterest"],
      notes: "All linen is grown and woven in Normandy. Avoid clichés like 'effortless chic'.",
    },
  },
  {
    label: "Sora Athletic — city running",
    brief: {
      brandName: "Sora Athletic",
      collection: "Nightline reflective running capsule",
      audience: "Urban runners 20–35 who train after work and treat running as their social life",
      goal: "Grow brand awareness with Gen Z runners and drive sign-ups for the Nightline run club",
      tone: "Electric, inclusive, kinetic, a little cheeky",
      platforms: ["tiktok", "instagram", "youtube"],
      notes: "Hero product is the Nightline jacket with 360° reflective piping.",
    },
  },
  {
    label: "Halden Studio — archive denim",
    brief: {
      brandName: "Halden Studio",
      collection: "Archive Indigo — denim made from reclaimed deadstock",
      audience: "Vintage lovers and menswear enthusiasts 22–40 who value craft and story",
      goal: "Position the brand as the authority on circular denim and sell out the limited first drop",
      tone: "Raw, honest, workwear heritage meets editorial",
      platforms: ["instagram", "youtube", "x"],
      notes: "Each pair carries a numbered tag tracing the original deadstock bolt.",
    },
  },
];

export const EMPTY_BRIEF: BriefInput = {
  brandName: "",
  collection: "",
  audience: "",
  goal: "",
  tone: "",
  platforms: ["instagram", "tiktok"],
  notes: "",
};
