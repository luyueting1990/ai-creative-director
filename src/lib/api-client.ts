import type {
  ApiErrorBody,
  ApiErrorCode,
  BriefInput,
  Campaign,
  GenerateResponseBody,
  StatusResponseBody,
} from "./schema";

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode | "NETWORK",
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestCampaign(
  brief: BriefInput,
  mode: "demo" | "live",
  photoCount = 0,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<Campaign> {
  let res: Response;
  try {
    res = await fetchImpl("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief, mode, photoCount }),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError("NETWORK", "Network error — check your connection and try again.");
  }

  const data = (await res.json().catch(() => null)) as GenerateResponseBody | ApiErrorBody | null;
  if (!res.ok || !data || "error" in data) {
    const e = data && "error" in data ? data.error : null;
    throw new ApiError(
      e?.code ?? "UPSTREAM_ERROR",
      e?.message ?? `Request failed (${res.status}).`,
      res.status,
    );
  }
  return data.campaign;
}

export async function fetchStatus(fetchImpl: typeof fetch = fetch): Promise<StatusResponseBody> {
  try {
    const res = await fetchImpl("/api/status", { cache: "no-store" });
    if (!res.ok) throw new Error();
    return (await res.json()) as StatusResponseBody;
  } catch {
    return { liveAvailable: false, model: "" };
  }
}
