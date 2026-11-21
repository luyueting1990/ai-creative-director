import { describe, expect, it } from "vitest";
import { classifyLink, displayLink, isHttpUrl, normalizeUrlInput } from "./links";

describe("links", () => {
  it.each([
    ["https://www.instagram.com/brand/", "instagram"],
    ["https://instagram.com/reel/abc", "instagram"],
    ["https://www.tiktok.com/@brand/video/1", "tiktok"],
    ["https://vm.tiktok.com/xyz", "tiktok"],
    ["https://youtu.be/abc", "youtube"],
    ["https://m.youtube.com/watch?v=1", "youtube"],
    ["https://brand.com", "website"],
    ["https://notinstagram.com", "website"],
  ])("classifies %s as %s", (url, kind) => {
    expect(classifyLink(url)).toBe(kind);
  });

  it("validates http(s) URLs only", () => {
    expect(isHttpUrl("https://a.com")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("ftp://a.com")).toBe(false);
    expect(isHttpUrl("https://localhost")).toBe(false);
  });

  it("adds https:// to bare domains", () => {
    expect(normalizeUrlInput(" instagram.com/brand ")).toBe("https://instagram.com/brand");
    expect(normalizeUrlInput("http://a.com")).toBe("http://a.com");
    expect(normalizeUrlInput("hello")).toBe("hello");
  });

  it("shortens links for display", () => {
    expect(displayLink("https://www.instagram.com/brand/")).toBe("instagram.com/brand");
  });
});
