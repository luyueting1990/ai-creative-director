import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Vitest doesn't expose globals here, so register RTL cleanup explicitly.
afterEach(async () => {
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
});
