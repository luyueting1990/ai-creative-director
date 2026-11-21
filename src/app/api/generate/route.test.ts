import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateDemoCampaign } from "@/lib/demo";
import { liveLimiter } from "@/lib/server/rate-limit";
import { brief } from "@/test/fixtures";

const generateWithClaude = vi.fn();
vi.mock("@/lib/server/claude", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/server/claude")>();
  return { ...actual, generateWithClaude: (...args: unknown[]) => generateWithClaude(...args) };
});

const { POST } = await import("./route");
const { GenerationError } = await import("@/lib/server/claude");

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  liveLimiter.reset();
  generateWithClaude.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/generate", () => {
  it("returns a demo campaign without an API key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const res = await post({ brief, mode: "demo" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.campaign.concepts).toHaveLength(3);
    expect(json.campaign.source).toBe("demo");
    expect(json.campaign.overview.summary).toContain("Atelier Noor");
    expect(generateWithClaude).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const res = await post("{oops");
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_REQUEST");
  });

  it("rejects an invalid brief with field details", async () => {
    const res = await post({ brief: { ...brief, brandName: "" } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toBe("Brand name is required");
    expect(json.error.details[0].path).toBe("brief.brandName");
  });

  it("rejects oversized bodies", async () => {
    const res = await post({ brief: { ...brief, brandDescription: "x".repeat(20_000) } });
    expect(res.status).toBe(413);
  });

  it("returns 503 for live mode when no key is configured", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const res = await post({ brief, mode: "live" });
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("LIVE_UNAVAILABLE");
  });

  it("generates with Claude in live mode", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    generateWithClaude.mockResolvedValue({ ...generateDemoCampaign(brief), source: "claude" });
    const res = await post({ brief, mode: "live", photoCount: 2 });
    expect(res.status).toBe(200);
    expect((await res.json()).campaign.source).toBe("claude");
    expect(generateWithClaude).toHaveBeenCalledWith(expect.objectContaining({ brandName: "Atelier Noor" }), 2);
  });

  it("surfaces typed generation errors", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    generateWithClaude.mockRejectedValue(new GenerationError("UPSTREAM_REFUSED", 422, "Declined"));
    const res = await post({ brief, mode: "live" });
    expect(res.status).toBe(422);
    expect((await res.json()).error).toEqual({ code: "UPSTREAM_REFUSED", message: "Declined" });
  });

  it("rate-limits live generations per client", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    generateWithClaude.mockResolvedValue(generateDemoCampaign(brief));
    const headers = { "x-forwarded-for": "9.9.9.9" };
    for (let i = 0; i < 10; i++) expect((await post({ brief, mode: "live" }, headers)).status).toBe(200);
    const res = await post({ brief, mode: "live" }, headers);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });
});
