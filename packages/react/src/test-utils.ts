import React from "react";

/** React's act(): `react`'s since React 18.3, react-dom's test utils' before (18.0–18.2). */
export const act: typeof React.act = (React as { act?: typeof React.act }).act ?? (await import("react-dom/test-utils")).act;

/**
 * Asserts that a rendered component did NOT hit the error fallback.
 * The error fallback contains "failed to render" text — if that's
 * present, the component crashed and the test should fail.
 */
export function expectNoRenderError(container: HTMLElement): void {
  const html = container.innerHTML;
  if (html.includes("failed to render")) {
    throw new Error(
      `Component crashed to error fallback.\nRendered HTML:\n${html}`
    );
  }
}
