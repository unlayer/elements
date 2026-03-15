// @vitest-environment node

/**
 * Verifies the package can be imported in a plain Node.js environment
 * (no jsdom, no browser APIs). This catches module-level calls to
 * browser/client-only APIs like createContext that would break
 * Next.js Server Components or other SSR runtimes.
 */

import { describe, it, expect } from "vitest";

describe("Node environment import", () => {
  it("imports without calling createContext at module level", async () => {
    const mod = await import("./index");

    expect(mod.Button).toBeDefined();
    expect(mod.Body).toBeDefined();
    expect(mod.Row).toBeDefined();
    expect(mod.Column).toBeDefined();
    expect(mod.renderToHtml).toBeDefined();
    expect(mod.UnlayerProvider).toBeDefined();
  });
});
