import { generateDemoCampaign } from "@/lib/demo";
import { GenerateRequestSchema, type GenerateResponseBody } from "@/lib/schema";
import { GenerationError, generateWithClaude, isLiveAvailable } from "@/lib/server/claude";
import { jsonError } from "@/lib/server/http";
import { clientKey, liveLimiter } from "@/lib/server/rate-limit";

// Claude generations can take a while; give the function room on Vercel.
export const maxDuration = 120;

const MAX_BODY_BYTES = 16_000;


export async function POST(req: Request): Promise<Response> {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) {
    return jsonError(413, "INVALID_REQUEST", "Brief is too large.");
  }

  let json: unknown;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return jsonError(413, "INVALID_REQUEST", "Brief is too large.");
    }
    json = JSON.parse(raw);
  } catch {
    return jsonError(400, "INVALID_REQUEST", "Request body must be valid JSON.");
  }

  const parsed = GenerateRequestSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(
      400,
      "INVALID_REQUEST",
      parsed.error.issues[0]?.message ?? "Invalid brief.",
      parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }

  const { brief, mode } = parsed.data;

  if (mode === "demo") {
    const body: GenerateResponseBody = { campaign: generateDemoCampaign(brief) };
    return Response.json(body);
  }

  if (!isLiveAvailable()) {
    return jsonError(
      503,
      "LIVE_UNAVAILABLE",
      "Live generation isn't configured on this deployment. Switch to Demo mode or set ANTHROPIC_API_KEY.",
    );
  }

  const limit = liveLimiter.check(clientKey(req));
  if (!limit.ok) {
    return jsonError(
      429,
      "RATE_LIMITED",
      `Live generation limit reached. Try again in ${Math.ceil(limit.retryAfterSec / 60)} min, or use Demo mode.`,
      undefined,
      { "Retry-After": String(limit.retryAfterSec) },
    );
  }

  try {
    const body: GenerateResponseBody = { campaign: await generateWithClaude(brief) };
    return Response.json(body);
  } catch (err) {
    const e = err instanceof GenerationError ? err : new GenerationError("UPSTREAM_ERROR", 500, "Unexpected error.");
    console.error("[generate] live generation failed:", e.code, err);
    return jsonError(e.status, e.code, e.message);
  }
}
