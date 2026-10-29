import { describe, expect, it } from "vitest";

// See test-setup.ts: a turn of the event loop between tests, so a file's synchronous tests that run more than a minute
// together don't time out vitest's report of their results.
describe("the test setup", () => {
  let turned = false;
  it("runs a test that leaves a macrotask behind", () => {
    setImmediate(() => (turned = true));
  });

  it("turns the event loop before the next test", () => {
    expect(turned).toBe(true);
  });
});
