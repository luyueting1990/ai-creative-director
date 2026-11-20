import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { InvalidGenerationError, normalizeGeneratedCampaign } from "../normalize";
import { GeneratedCampaignSchema, SYSTEM_PROMPT, buildUserPrompt } from "../prompt";
import type { ApiErrorCode, Brief, Campaign } from "../schema";

export const DEFAULT_MODEL = "claude-opus-5-5";

/** Models that accept the server-side refusal fallback parameter. */
const FALLBACK_MODELS = new Set([
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-sonnet-5-5",
  "claude-fable-5-2",
  "claude-fable-5-1",
]);

export function getModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

export function isLiveAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export class GenerationError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

/** Minimal surface of the SDK client we depend on — lets tests inject a fake. */
export type ClaudeClient = Pick<Anthropic, "beta">;

let cachedClient: Anthropic | null = null;
function defaultClient(): Anthropic {
  // The key is read from ANTHROPIC_API_KEY on the server only; it never
  // reaches the browser bundle because this module imports "server-only".
  cachedClient ??= new Anthropic({ maxRetries: 2, timeout: 110_000 });
  return cachedClient;
}

export async function generateWithClaude(
  brief: Brief,
  client: ClaudeClient = defaultClient(),
): Promise<Campaign> {
  const model = getModel();
  const useFallbacks = FALLBACK_MODELS.has(model);

  try {
    const stream = client.beta.messages.stream({
      model,
      max_tokens: 32000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(brief) }],
      output_config: {
        effort: "medium",
        format: betaZodOutputFormat(GeneratedCampaignSchema),
      },
      ...(useFallbacks
        ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
        : {}),
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      throw new GenerationError(
        "UPSTREAM_REFUSED",
        422,
        "Claude declined to generate this campaign. Try rephrasing the brief.",
      );
    }
    if (message.stop_reason === "max_tokens") {
      throw new GenerationError(
        "UPSTREAM_INVALID_OUTPUT",
        502,
        "The response was cut off before it finished. Please try again.",
      );
    }
    if (!message.parsed_output) {
      throw new GenerationError(
        "UPSTREAM_INVALID_OUTPUT",
        502,
        "Claude returned a response that could not be read as a campaign.",
      );
    }

    return normalizeGeneratedCampaign(message.parsed_output, brief, message.model ?? model);
  } catch (err) {
    throw toGenerationError(err);
  }
}

/** Maps SDK and parsing errors to safe, user-facing API errors. */
export function toGenerationError(err: unknown): GenerationError {
  if (err instanceof GenerationError) return err;
  if (err instanceof InvalidGenerationError) {
    return new GenerationError("UPSTREAM_INVALID_OUTPUT", 502, err.message);
  }
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new GenerationError(
      "UPSTREAM_AUTH",
      502,
      "The server's Anthropic API key was rejected. Check ANTHROPIC_API_KEY.",
    );
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new GenerationError(
      "UPSTREAM_RATE_LIMITED",
      429,
      "Claude is receiving too many requests right now. Please wait a moment and retry.",
    );
  }
  if (err instanceof Anthropic.BadRequestError) {
    return new GenerationError("UPSTREAM_ERROR", 502, "Claude rejected the request.");
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new GenerationError(
      "UPSTREAM_ERROR",
      504,
      "Could not reach Claude. Check your connection and try again.",
    );
  }
  if (err instanceof Anthropic.APIError) {
    return new GenerationError(
      "UPSTREAM_ERROR",
      502,
      `Claude returned an error${err.status ? ` (${err.status})` : ""}. Please try again.`,
    );
  }
  if (err instanceof SyntaxError) {
    return new GenerationError(
      "UPSTREAM_INVALID_OUTPUT",
      502,
      "Claude returned malformed JSON. Please try again.",
    );
  }
  return new GenerationError("UPSTREAM_ERROR", 500, "Unexpected error while generating the campaign.");
}
