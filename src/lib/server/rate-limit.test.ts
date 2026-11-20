import { describe, expect, it } from "vitest";
import { clientKey, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit within a window, then blocks", () => {
    const rl = createRateLimiter(2, 1000);
    expect(rl.check("a", 0).ok).toBe(true);
    expect(rl.check("a", 10).ok).toBe(true);
    const blocked = rl.check("a", 500);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(1);
    expect(rl.check("b", 500).ok).toBe(true);
  });

  it("resets after the window", () => {
    const rl = createRateLimiter(1, 1000);
    rl.check("a", 0);
    expect(rl.check("a", 999).ok).toBe(false);
    expect(rl.check("a", 1000).ok).toBe(true);
  });
});

describe("clientKey", () => {
  it("uses the first forwarded address", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" } });
    expect(clientKey(req)).toBe("1.1.1.1");
    expect(clientKey(new Request("http://x"))).toBe("anonymous");
  });
});
