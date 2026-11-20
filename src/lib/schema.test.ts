import { describe, expect, it } from "vitest";
import { BriefSchema, GenerateRequestSchema } from "./schema";
import { brief } from "@/test/fixtures";

describe("BriefSchema", () => {
  it("accepts a complete brief and defaults notes", () => {
    const parsed = BriefSchema.parse({ ...brief, notes: undefined });
    expect(parsed.notes).toBe("");
  });

  it("trims and rejects blank required fields", () => {
    const r = BriefSchema.safeParse({ ...brief, brandName: "   " });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("Brand name is required");
  });

  it("requires at least one known platform", () => {
    expect(BriefSchema.safeParse({ ...brief, platforms: [] }).success).toBe(false);
    expect(BriefSchema.safeParse({ ...brief, platforms: ["myspace"] }).success).toBe(false);
  });

  it("caps field lengths to protect the prompt budget", () => {
    expect(BriefSchema.safeParse({ ...brief, notes: "x".repeat(1201) }).success).toBe(false);
  });
});

describe("GenerateRequestSchema", () => {
  it("defaults to demo mode", () => {
    expect(GenerateRequestSchema.parse({ brief }).mode).toBe("demo");
  });
});
