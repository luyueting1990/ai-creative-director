import { connection } from "next/server";
import type { StatusResponseBody } from "@/lib/schema";
import { getModel, isLiveAvailable } from "@/lib/server/claude";

/** Tells the UI whether live Claude generation is configured (never exposes the key). */
export async function GET(): Promise<Response> {
  // Read env at request time rather than baking it in at build time.
  await connection();
  const body: StatusResponseBody = { liveAvailable: isLiveAvailable(), model: getModel() };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
