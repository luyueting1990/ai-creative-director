import Anthropic from "@anthropic-ai/sdk";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GeneratedCampaign } from "../prompt";
import { GenerationError, generateWithClaude, getModel, isLiveAvailable, toGenerationError, type ClaudeClient } from "./claude";
import { brief } from "@/test/fixtures";
import { rawCampaign, rawConcept, rawRead } from "@/test/generated";

const parsed: GeneratedCampaign = rawCampaign();

function fakeClient(result: object | (() => never)) {
  const stream = vi.fn(() => ({
    finalMessage: async () => (typeof result === "function" ? result() : result),
  }));
  return { client: { beta: { messages: { stream } } } as unknown as ClaudeClient, stream };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("generateWithClaude", () => {
  it("calls Claude with structured output and returns a normalised campaign", async () => {
    const { client, stream } = fakeClient({
      stop_reason: "end_turn",
      model: "claude-opus-5-5",
      parsed_output: parsed,
    });
    const campaign = await generateWithClaude(brief, 0, client);

    expect(campaign.concepts.map((c) => c.title)).toEqual(["A", "B", "C"]);
    expect(campaign.read.summary).toBe("Summary");
    expect(campaign.source).toBe("claude");

    const params = (stream.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.output_config).toMatchObject({ effort: "medium", format: { type: "json_schema" } });
    expect(params.fallbacks).toBe("default");
    expect(params).not.toHaveProperty("thinking");
    expect(String((params.messages as { content: string }[])[0].content)).toContain("Atelier Noor");
  });

  it("omits fallbacks for models that don't support them", async () => {
    vi.stubEnv("ANTHROPIC_MODEL", "claude-haiku-5-5");
    const { client, stream } = fakeClient({ stop_reason: "end_turn", parsed_output: parsed });
    await generateWithClaude(brief, 0, client);
    const params = (stream.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(params.model).toBe("claude-haiku-5-5");
    expect(params).not.toHaveProperty("fallbacks");
  });

  it.each([
    [{ stop_reason: "refusal", parsed_output: null }, "UPSTREAM_REFUSED"],
    [{ stop_reason: "max_tokens", parsed_output: null }, "UPSTREAM_INVALID_OUTPUT"],
    [{ stop_reason: "end_turn", parsed_output: null }, "UPSTREAM_INVALID_OUTPUT"],
    [{ stop_reason: "end_turn", parsed_output: { read: rawRead, concepts: [rawConcept("A")] } }, "UPSTREAM_INVALID_OUTPUT"],
  ])("maps %o to %s", async (message, code) => {
    const { client } = fakeClient(message);
    await expect(generateWithClaude(brief, 0, client)).rejects.toMatchObject({ code });
  });

  it("maps thrown SDK errors", async () => {
    const { client } = fakeClient(() => {
      throw new Anthropic.RateLimitError(429, {}, "slow down", new Headers());
    });
    await expect(generateWithClaude(brief, 0, client)).rejects.toMatchObject({
      code: "UPSTREAM_RATE_LIMITED",
      status: 429,
    });
  });
});

describe("toGenerationError", () => {
  it.each([
    [new Anthropic.AuthenticationError(401, {}, "bad key", new Headers()), "UPSTREAM_AUTH"],
    [new Anthropic.BadRequestError(400, {}, "bad", new Headers()), "UPSTREAM_ERROR"],
    [new Anthropic.InternalServerError(500, {}, "boom", new Headers()), "UPSTREAM_ERROR"],
    [new Anthropic.APIConnectionError({ message: "offline" }), "UPSTREAM_ERROR"],
    [new SyntaxError("Unexpected token"), "UPSTREAM_INVALID_OUTPUT"],
    [new Error("???"), "UPSTREAM_ERROR"],
  ])("maps %s", (err, code) => {
    const mapped = toGenerationError(err);
    expect(mapped).toBeInstanceOf(GenerationError);
    expect(mapped.code).toBe(code);
    // Never leak raw upstream messages (which may include request details).
    expect(mapped.message).not.toContain("bad key");
  });
});

describe("configuration", () => {
  it("detects the API key and model from the environment", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(isLiveAvailable()).toBe(false);
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    expect(isLiveAvailable()).toBe(true);
    vi.stubEnv("ANTHROPIC_MODEL", "");
    expect(getModel()).toBe("claude-opus-5-5");
  });
});
