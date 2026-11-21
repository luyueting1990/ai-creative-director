import { describe, expect, it } from "vitest";
import { formatBytes, toPhotoItem, toPhotoMeta, validatePhotoFiles } from "./photos";

const file = (name: string, type = "image/png", size = 1000) => new File([new Uint8Array(size)], name, { type });

describe("validatePhotoFiles", () => {
  it("accepts images up to the limit", () => {
    const { accepted, errors } = validatePhotoFiles([file("a.png"), file("b.jpg", "image/jpeg")], 0);
    expect(accepted).toHaveLength(2);
    expect(errors).toEqual([]);
  });

  it("rejects non-images and oversized files", () => {
    const big = file("big.png", "image/png", 11 * 1024 * 1024);
    const { accepted, errors } = validatePhotoFiles([file("doc.pdf", "application/pdf"), big], 0);
    expect(accepted).toHaveLength(0);
    expect(errors[0]).toMatch(/isn't a supported image/);
    expect(errors[1]).toMatch(/larger than 10MB/);
  });

  it("enforces the six-photo maximum", () => {
    const { accepted, errors } = validatePhotoFiles([file("a.png"), file("b.png")], 5);
    expect(accepted.map((f) => f.name)).toEqual(["a.png"]);
    expect(errors[0]).toMatch(/up to 6 photos/);
  });
});

describe("photo helpers", () => {
  it("creates items with an object URL and strips it for storage", () => {
    const item = toPhotoItem(file("a.png"), () => "blob:x");
    expect(item).toMatchObject({ name: "a.png", type: "image/png", url: "blob:x" });
    expect(toPhotoMeta(item)).not.toHaveProperty("url");
  });

  it("formats sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
