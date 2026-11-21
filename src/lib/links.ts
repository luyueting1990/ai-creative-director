/** Helpers for the reference links users attach to a brief. */

export type LinkKind = "instagram" | "tiktok" | "youtube" | "website";

export const LINK_LABELS: Record<LinkKind, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  website: "Website",
};

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}

function host(value: string): string {
  try {
    return new URL(value.trim()).hostname.toLowerCase().replace(/^www\.|^m\./, "");
  } catch {
    return "";
  }
}

export function classifyLink(value: string): LinkKind {
  const h = host(value);
  if (h === "instagram.com" || h.endsWith(".instagram.com") || h === "instagr.am") return "instagram";
  if (h === "tiktok.com" || h.endsWith(".tiktok.com")) return "tiktok";
  if (h === "youtube.com" || h.endsWith(".youtube.com") || h === "youtu.be") return "youtube";
  return "website";
}

/** Short human label, e.g. "instagram.com/brand" or "youtube.com/watch". */
export function displayLink(value: string): string {
  try {
    const u = new URL(value.trim());
    const path = u.pathname.replace(/\/$/, "");
    const label = `${u.hostname.replace(/^www\./, "")}${path}`;
    return label.length > 48 ? `${label.slice(0, 45)}…` : label;
  } catch {
    return value;
  }
}

/** Adds https:// to bare domains such as "instagram.com/brand". */
export function normalizeUrlInput(value: string): string {
  const v = value.trim();
  if (!v) return v;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(v)) return `https://${v}`;
  return v;
}
